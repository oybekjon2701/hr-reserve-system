function calculateScore(candidate) {
  const breakdown = {};
  let total = 0;

  // Education (20 points)
  const eduScores = {
    "Oliy (magistr)": 20,
    "Oliy (bakalavr)": 17,
    "Oliy (doktorantura)": 20,
    "O'rta maxsus": 12,
    "O'rta": 8
  };
  const eduScore = eduScores[candidate.education_level] || 10;
  breakdown.education = { score: eduScore, max: 20, label: "Ta'lim", detail: candidate.education_level || "Aniqlanmagan" };
  total += eduScore;

  // Experience (35 points)
  const expYears = parseFloat(candidate.total_experience) || 0;
  let expScore = 0;
  if (expYears >= 10) expScore = 35;
  else if (expYears >= 7) expScore = 30;
  else if (expYears >= 5) expScore = 25;
  else if (expYears >= 3) expScore = 20;
  else if (expYears >= 1) expScore = 12;
  else expScore = 5;
  breakdown.experience = { score: expScore, max: 35, label: "Ish tajribasi", detail: `${expYears} yil` };
  total += expScore;

  // Computer skills (15 points)
  const compSkillScores = {
    "Yuqori": 15,
    "O'rta": 10,
    "Past": 4,
    "Bilmayman": 0
  };
  const compScore = compSkillScores[candidate.computer_skill_level] || 5;
  breakdown.computer_skills = { score: compScore, max: 15, label: "Kompyuter bilimlari", detail: candidate.computer_skill_level || "Aniqlanmagan" };
  total += compScore;

  // Language skills (10 points)
  let langScore = 0;
  if (candidate.language_skills) {
    const langs = candidate.language_skills.toLowerCase();
    if (langs.includes("yuqori") || langs.includes("b2") || langs.includes("c1") || langs.includes("c2") || langs.includes("mukammal")) langScore = 10;
    else if (langs.includes("o'rta") || langs.includes("b1") || langs.includes("yaxshi")) langScore = 7;
    else if (langs.includes("boshlang'ich") || langs.includes("a1") || langs.includes("a2")) langScore = 4;
    else langScore = 5;
  }
  breakdown.language_skills = { score: langScore, max: 10, label: "Til bilimlari", detail: candidate.language_skills || "Aniqlanmagan" };
  total += langScore;

  // Profile completeness (10 points)
  const fields = [
    candidate.full_name, candidate.phone, candidate.email,
    candidate.education_level, candidate.total_experience,
    candidate.desired_position, candidate.availability,
    candidate.known_programs
  ];
  const filled = fields.filter(f => f && f.trim() !== '').length;
  const completeness = Math.round((filled / fields.length) * 10);
  breakdown.completeness = { score: completeness, max: 10, label: "Profil to'liqligi", detail: `${filled}/${fields.length} maydon` };
  total += completeness;

  // Availability (10 points)
  let availScore = 0;
  if (candidate.availability) {
    const a = candidate.availability.toLowerCase();
    if (a.includes("darhol") || a.includes("hozir") || a.includes("1 hafta") || a.includes("bir hafta")) availScore = 10;
    else if (a.includes("2 hafta") || a.includes("ikki hafta") || a.includes("bir oy") || a.includes("1 oy")) availScore = 7;
    else if (a.includes("2 oy") || a.includes("ikki oy")) availScore = 5;
    else availScore = 3;
  }
  breakdown.availability = { score: availScore, max: 10, label: "Mavjudlik", detail: candidate.availability || "Aniqlanmagan" };
  total += availScore;

  // Bonus for ready full-time
  if (candidate.ready_full_time && candidate.ready_full_time.toLowerCase().includes('ha')) {
    total += 5;
    breakdown.full_time_bonus = { score: 5, max: 5, label: "To'liq stavka bonusi", detail: "To'liq stavkaga tayyor" };
  }

  total = Math.min(Math.max(Math.round(total), 0), 100);

  return { score: total, breakdown };
}

module.exports = { calculateScore };
