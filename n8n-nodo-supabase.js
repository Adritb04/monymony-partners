// ─────────────────────────────────────────────────────────
// NODO: "Save to Supabase" — pega este código en el nodo Code
// Reemplaza el nodo "Save to Airtable" en tu workflow
// ─────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://TU-PROJECT.supabase.co';   // ← cambia esto
const SUPABASE_KEY = 'eyJhbGci...TU-ANON-KEY';           // ← cambia esto

const analysis = $json.analysis || {};
const imageUrl  = $('Edit Fields1').item.json.webContentLink || '';
const fileName  = $('Edit Fields1').item.json.driveFlieName  || '';
const fileId    = $('Edit Fields1').item.json.driveFileId    || '';

const product = {
  name:          analysis.Name          || analysis.title       || fileName || 'Sin nombre',
  description:   analysis.Descripcion   || analysis.description || '',
  category:      analysis.Categoria     || analysis.category    || 'Sin categoría',
  price:         analysis['Precio sugerido'] || analysis.precio_sugerido || 0,
  price_min:     analysis['Precio minimo']   || analysis.precio_minimo   || null,
  price_max:     analysis['Precio Maximo']   || analysis.precio_maximo   || null,
  emoji:         '📦',
  image_url:     imageUrl,
  stock:         1,
  status:        'available',
  condition:     analysis.Estado        || analysis.condition   || '',
  size:          analysis.Talla         || analysis.size        || '',
  dimensions:    analysis.Dimensiones   || analysis.dimensions  || '',
  material:      analysis.Material      || analysis.material    || '',
  defects:       analysis.Defectos      || analysis.defects     || '',
  shipping:      analysis.Envios        || analysis.shipping    || '',
  keywords:      analysis['Palabras claves'] || (analysis.keywords || []).join(', '),
  notes:         analysis.Observaciones || analysis.notes       || '',
  brand:         analysis.brand         || '',
  drive_file_id: fileId,
};

// Upsert en Supabase (evita duplicados por drive_file_id)
const response = await $http.request({
  method:  'POST',
  url:     `${SUPABASE_URL}/rest/v1/products`,
  headers: {
    'apikey':        SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'resolution=merge-duplicates,return=representation',
  },
  body: product,
  json: true,
});

return {
  supabase_ok:      true,
  product_name:     product.name,
  product_category: product.category,
  product_price:    product.price,
  image_url:        imageUrl,
};
