const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useRef } from 'react';
import { Upload, Loader2, Download } from 'lucide-react';

import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const COLUMN_MAP = {
  date: ['date', 'day', 'sale_date', 'transaction_date', 'sales_date'],
  product: ['product', 'item', 'name', 'menu_item', 'product_name', 'description'],
  quantity_sold: ['quantity_sold', 'quantity', 'qty', 'units', 'count', 'sold', 'units_sold', 'amount_sold'],
  revenue: ['revenue', 'sales', 'total', 'price', 'income', 'total_sales', 'amount'],
  day_of_week: ['day_of_week', 'weekday', 'dow'],
  weather: ['weather', 'condition', 'conditions'],
  temperature: ['temperature', 'temp']
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;
    const record = {};
    headers.forEach((h, idx) => { record[h] = values[idx] || ''; });
    records.push(record);
  }
  return records;
}

function normalizeDate(dateStr) {
  if (!dateStr) return '';
  dateStr = dateStr.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const usMatch = dateStr.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateStr;
}

function getDayOfWeek(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } catch (e) {
    return '';
  }
}

function mapRecord(rawRecord) {
  const mapped = {};
  Object.entries(COLUMN_MAP).forEach(([targetField, possibleNames]) => {
    for (const name of possibleNames) {
      if (rawRecord[name] !== undefined && rawRecord[name] !== '') {
        mapped[targetField] = rawRecord[name];
        break;
      }
    }
  });
  if (mapped.date) mapped.date = normalizeDate(mapped.date);
  if (!mapped.day_of_week && mapped.date) mapped.day_of_week = getDayOfWeek(mapped.date);
  mapped.quantity_sold = parseFloat(mapped.quantity_sold) || 0;
  if (mapped.revenue) mapped.revenue = parseFloat(String(mapped.revenue).replace(/[$,]/g, '')) || 0;
  if (mapped.temperature) mapped.temperature = parseFloat(mapped.temperature) || undefined;
  return mapped;
}

export default function DataImporter({ onImported }) {
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const csv = [
      'date,product,quantity_sold,revenue,day_of_week,weather,temperature',
      '2026-07-01,Sandwich,45,225,Monday,Sunny,72',
      '2026-07-01,Coffee,120,360,Monday,Sunny,72',
      '2026-07-02,Sandwich,38,190,Tuesday,Cloudy,68',
      '2026-07-02,Coffee,110,330,Tuesday,Cloudy,68',
      '2026-07-03,Sandwich,52,260,Wednesday,Sunny,75',
      '2026-07-03,Coffee,135,405,Wednesday,Sunny,75',
      '2026-07-04,Sandwich,30,150,Thursday,Rain,65',
      '2026-07-04,Coffee,85,255,Thursday,Rain,65'
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-data-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.csv$/i)) {
      toast({ title: 'Invalid file', description: 'Please upload a CSV file.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      setStage('Reading file...');
      const text = await file.text();

      setStage('Parsing CSV data...');
      const rawRecords = parseCSV(text);

      if (rawRecords.length === 0) {
        throw new Error('No data rows found in the CSV file.');
      }

      setStage('Processing records...');
      const mapped = rawRecords.map(mapRecord);
      const validRecords = mapped.filter(r => r.product && r.quantity_sold > 0);

      if (validRecords.length === 0) {
        throw new Error('No valid records found. Ensure your CSV has product and quantity columns.');
      }

      const seen = new Set();
      const unique = [];
      validRecords.forEach(r => {
        const key = `${r.date}_${r.product}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(r);
        }
      });

      setStage(`Importing ${unique.length} records...`);
      const BATCH_SIZE = 400;
      for (let i = 0; i < unique.length; i += BATCH_SIZE) {
        await db.entities.SalesRecord.bulkCreate(unique.slice(i, i + BATCH_SIZE));
      }

      toast({
        title: 'Data Imported',
        description: `${unique.length} records successfully imported.`,
      });

      onImported?.();
    } catch (e) {
      toast({
        title: 'Import Failed',
        description: e.message || 'Failed to import data.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setStage('');
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !uploading && fileRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          dragOver ? "border-[hsl(152,56%,40%)] bg-[hsl(152,50%,97%)]" : "border-[hsl(150,15%,85%)] hover:border-[hsl(152,50%,60%)] hover:bg-[hsl(150,30%,97%)]",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-[hsl(152,56%,40%)] animate-spin" />
            <p className="text-sm font-medium text-[hsl(152,56%,20%)]">{stage}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[hsl(152,50%,94%)] flex items-center justify-center">
              <Upload className="w-7 h-7 text-[hsl(152,56%,30%)]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[hsl(152,56%,15%)]">Drop your CSV file here</p>
              <p className="text-xs text-[hsl(152,10%,45%)] mt-1">or click to browse · CSV files only</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="text-xs text-[hsl(152,10%,45%)]">
          <p className="font-semibold text-[hsl(152,10%,35%)] mb-1">Expected columns:</p>
          <p>date, product, quantity_sold, revenue, day_of_week, weather, temperature</p>
          <p className="mt-1 italic">Only product and quantity_sold are required — column names are matched flexibly.</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[hsl(152,56%,30%)] bg-[hsl(152,50%,94%)] hover:bg-[hsl(152,50%,90%)] transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Template
        </button>
      </div>
    </div>
  );
}