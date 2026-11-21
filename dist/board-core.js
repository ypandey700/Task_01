export function validateRecords(data) {
  if (!Array.isArray(data)) throw new Error('Expected an array of internships.');
  const ids = new Set();
  for (const item of data) {
    if (!item || !['id','title','company','domain','mode','location','duration','posted','description','logo','color'].every(key => typeof item[key] === 'string' && item[key].trim()) || !Number.isFinite(item.stipend) || item.stipend < 0 || !Array.isArray(item.skills) || !item.skills.every(s => typeof s === 'string') || !['Full Stack Development','UI/UX','Data Analytics','Cyber Security'].includes(item.domain) || !['Remote','Hybrid','On-site'].includes(item.mode) || !/^#[0-9a-f]{6}$/i.test(item.color) || !Number.isFinite(Date.parse(item.posted)) || ids.has(item.id)) throw new Error('Invalid internship record.');
    ids.add(item.id);
  }
  return data;
}

export function filterRecords(records, {query = '', domains = [], mode = '', paid = false, savedOnly = false, saved = [], sort = 'newest'} = {}) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return records.filter(item => {
    const text = [item.title, item.company, item.domain, item.location, ...item.skills].join(' ').toLocaleLowerCase();
    return terms.every(term => text.includes(term)) && (!domains.length || domains.includes(item.domain)) && (!mode || item.mode === mode) && (!paid || item.stipend > 0) && (!savedOnly || saved.includes(item.id));
  }).sort((a,b) => sort === 'stipend' ? b.stipend - a.stipend : sort === 'title' ? a.title.localeCompare(b.title) : Date.parse(b.posted) - Date.parse(a.posted));
}
