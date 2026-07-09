function generateSummary(candidate, scoreData) {
  const parts = [];
  const firstName = candidate.full_name ? candidate.full_name.split(' ')[0] : 'Nomzod';

  // Education
  if (candidate.education_level) {
    parts.push(`${candidate.education_level} darajasiga ega.`);
  } else {
    parts.push(`Ma'lumot darajasi aniqlanmagan.`);
  }

  // University
  if (candidate.university && candidate.university.trim()) {
    parts.push(`${candidate.university}ni tugatgan.`);
  }

  // Experience
  const expYears = parseFloat(candidate.total_experience) || 0;
  if (expYears > 0) {
    parts.push(`${expYears} yillik ish tajribasiga ega.`);
    if (candidate.last_workplace && candidate.last_position) {
      parts.push(`Oxirgi ish joyi: ${candidate.last_workplace} (${candidate.last_position}).`);
    }
  } else {
    parts.push(`Ish tajribasi yo'q yoki ko'rsatilmagan.`);
  }

  // Skills
  if (candidate.known_programs && candidate.known_programs.trim()) {
    const progs = candidate.known_programs.split(/[,;]\s*/).slice(0, 4).join(', ');
    parts.push(`${progs} dasturlarini biladi.`);
  }

  // Language
  if (candidate.language_skills && candidate.language_skills.trim()) {
    parts.push(`Chet tillari: ${candidate.language_skills}.`);
  }

  // Availability
  if (candidate.availability) {
    parts.push(`${candidate.availability} ish boshlashga tayyor.`);
  }

  // Position
  if (candidate.desired_position) {
    parts.push(`${candidate.desired_position} lavozimiga nomzod.`);
  }

  // Score
  if (scoreData && scoreData.score) {
    const score = scoreData.score;
    let level = "past";
    if (score >= 80) level = "yuqori";
    else if (score >= 60) level = "yaxshi";
    else if (score >= 40) level = "o'rta";
    parts.push(`Umumiy baho: ${score}/100 (${level}).`);
  }

  return parts.join(' ');
}

module.exports = { generateSummary };
