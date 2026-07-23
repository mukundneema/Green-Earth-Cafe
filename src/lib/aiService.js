const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


export async function generatePredictions() {
  const records = await db.entities.SalesRecord.list('-date', 500);
  if (!records || records.length === 0) {
    throw new Error('No sales data available. Please import a CSV file first.');
  }

  await db.entities.ProductionRecommendation.deleteMany({ status: 'pending' });

  const dates = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const products = [...new Set(records.map(r => r.product))];
  const dataForAI = records.map(r => ({
    date: r.date,
    product: r.product,
    quantity_sold: r.quantity_sold,
    revenue: r.revenue,
    day_of_week: r.day_of_week,
    weather: r.weather,
    temperature: r.temperature
  }));

  const result = await db.integrations.Core.InvokeLLM({
    prompt: `You are an AI food production consultant for a café. Analyze the following historical sales data and predict how much of each product to produce for each of the next 3 days.

The dates to predict for are:
- ${dates[0]}
- ${dates[1]}
- ${dates[2]}

The products in the data are: ${products.join(', ')}

Historical sales data (JSON):
${JSON.stringify(dataForAI)}

Analyze these patterns:
- Day of week patterns (which days sell more of each product)
- Weather impact on sales (if weather data is available)
- Overall growth or decline trends
- Average, min, and max daily sales per product

For EACH product and EACH of the 3 dates listed above, provide a recommendation with:
1. target_date: the date in YYYY-MM-DD format (one of: ${dates[0]}, ${dates[1]}, ${dates[2]})
2. product: exact product name as it appears in the data
3. recommended_quantity: a whole number of units to produce for that date
4. confidence: 0-100 confidence score (higher for products with more consistent data)
5. reasoning: clear explanation referencing specific patterns found in the data

Also provide overall_analysis: a summary of key insights, notable trends, and any anomalies in the data.

Be practical and slightly conservative — it's better to underproduce than overproduce to minimize waste.`,
    response_json_schema: {
      type: "object",
      properties: {
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              target_date: { type: "string" },
              product: { type: "string" },
              recommended_quantity: { type: "number" },
              confidence: { type: "number" },
              reasoning: { type: "string" }
            }
          }
        },
        overall_analysis: { type: "string" }
      }
    }
  });

  const recs = (result.recommendations || []).map(r => ({
    target_date: r.target_date,
    product: r.product,
    recommended_quantity: Math.round(r.recommended_quantity),
    confidence: r.confidence <= 1 ? Math.round(r.confidence * 100) : Math.round(r.confidence),
    reasoning: r.reasoning,
    status: 'pending',
    overall_analysis: result.overall_analysis
  })).filter(r => r.product && r.recommended_quantity > 0 && r.target_date);

  if (recs.length === 0) {
    throw new Error('AI could not generate predictions from the data. Please check your data format.');
  }

  await db.entities.ProductionRecommendation.bulkCreate(recs);
  return { count: recs.length, analysis: result.overall_analysis };
}

export async function getSalesSummary() {
  const records = await db.entities.SalesRecord.list('-date', 500);
  if (!records || records.length === 0) return null;

  const products = [...new Set(records.map(r => r.product))];
  const dates = [...new Set(records.map(r => r.date).filter(Boolean))].sort();
  const totalRevenue = records.reduce((s, r) => s + (r.revenue || 0), 0);
  const totalQty = records.reduce((s, r) => s + (r.quantity_sold || 0), 0);

  return {
    totalRecords: records.length,
    uniqueProducts: products.length,
    dateRange: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
    totalRevenue,
    totalQuantity: totalQty,
    avgDailyRevenue: dates.length > 0 ? Math.round(totalRevenue / dates.length) : 0,
    products,
    records
  };
}

export async function clearAllData() {
  await db.entities.SalesRecord.deleteMany({});
  await db.entities.ProductionRecommendation.deleteMany({});
}