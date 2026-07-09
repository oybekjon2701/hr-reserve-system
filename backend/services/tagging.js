function generateTags(candidate) {
  const tags = [];

  // Experience level tags
  const expYears = parseFloat(candidate.total_experience) || 0;
  if (expYears >= 10) tags.push("10+ yil tajriba");
  else if (expYears >= 7) tags.push("7+ yil tajriba");
  else if (expYears >= 5) tags.push("5+ yil tajriba");
  else if (expYears >= 3) tags.push("3+ yil tajriba");
  else if (expYears >= 1) tags.push("1+ yil tajriba");
  else tags.push("Tajribasiz");

  // Education tags
  if (candidate.education_level) {
    const edu = candidate.education_level.toLowerCase();
    if (edu.includes("magistr") || edu.includes("doktor")) tags.push("Oliy daraja");
    else if (edu.includes("bakalavr")) tags.push("Bakalavr");
    else if (edu.includes("maxsus")) tags.push("O'rta maxsus");
  }

  // University tag
  if (candidate.university && candidate.university.trim()) {
    tags.push(`${candidate.university.trim().substring(0, 30)}`);
  }

  // Program/Skills tags
  if (candidate.known_programs) {
    const programs = candidate.known_programs.split(/[,;]\s*/);
    programs.forEach(p => {
      const trimmed = p.trim();
      if (trimmed && trimmed.length < 25) {
        tags.push(trimmed);
      }
    });
  }

  // Language tags
  if (candidate.language_skills) {
    const langs = candidate.language_skills.toLowerCase();
    if (langs.includes("yuqori") || langs.includes("mukammal")) tags.push("Yuqori til darajasi");
  }

  // Availability tags
  if (candidate.availability) {
    const a = candidate.availability.toLowerCase();
    if (a.includes("darhol") || a.includes("hozir")) tags.push("Darhol ish boshlaydi");
    else if (a.includes("1 hafta") || a.includes("bir hafta")) tags.push("1 haftada ish boshlaydi");
    else if (a.includes("1 oy") || a.includes("bir oy")) tags.push("1 oyda ish boshlaydi");
  }

  // Full-time tag
  if (candidate.ready_full_time && candidate.ready_full_time.toLowerCase().includes('ha')) {
    tags.push("To'liq stavka");
  }

  // High score tag
  if (candidate.score >= 80) tags.push("Yuqori salohiyat");

  // Desired position tag
  if (candidate.desired_position && candidate.desired_position.trim()) {
    tags.push(`Nomzod: ${candidate.desired_position.trim().substring(0, 25)}`);
  }

  return [...new Set(tags)].slice(0, 15);
}

module.exports = { generateTags };
