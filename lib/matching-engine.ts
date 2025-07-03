// Advanced AI-Powered Matching Engine for Dharma Saathi
// This system uses multiple compatibility layers and machine learning-inspired algorithms

import { UserProfile } from './data-service'

export interface CompatibilityScore {
  total: number
  breakdown: {
    spiritual: number
    lifestyle: number
    psychological: number
    demographic: number
    preference: number
    semantic: number
    growth_potential: number
  }
  reasons: string[]
  concerns: string[]
  unique_strengths: string[]
}

export interface MatchingWeights {
  spiritual: number
  lifestyle: number
  psychological: number
  demographic: number
  preference: number
  semantic: number
  growth_potential: number
}

// Default weights - can be customized per user
const DEFAULT_WEIGHTS: MatchingWeights = {
  spiritual: 0.35,      // 35% - Most important for spiritual platform
  lifestyle: 0.20,      // 20% - Daily habits and preferences
  psychological: 0.15,  // 15% - Personality and mindset
  demographic: 0.10,    // 10% - Age, location, education
  preference: 0.12,     // 12% - Explicit partner preferences
  semantic: 0.05,       // 5% - Text analysis compatibility
  growth_potential: 0.03 // 3% - Future compatibility prediction
}

export class AdvancedMatchingEngine {
  private weights: MatchingWeights

  constructor(customWeights?: Partial<MatchingWeights>) {
    this.weights = { ...DEFAULT_WEIGHTS, ...customWeights }
  }

  /**
   * Calculate comprehensive compatibility between two profiles
   */
  calculateCompatibility(user: UserProfile, target: UserProfile): CompatibilityScore {
    const spiritual = this.calculateSpiritualCompatibility(user, target)
    const lifestyle = this.calculateLifestyleCompatibility(user, target)
    const psychological = this.calculatePsychologicalCompatibility(user, target)
    const demographic = this.calculateDemographicCompatibility(user, target)
    const preference = this.calculatePreferenceCompatibility(user, target)
    const semantic = this.calculateSemanticCompatibility(user, target)
    const growth_potential = this.calculateGrowthPotential(user, target)

    // Weighted total score
    const total = Math.round(
      spiritual.score * this.weights.spiritual +
      lifestyle.score * this.weights.lifestyle +
      psychological.score * this.weights.psychological +
      demographic.score * this.weights.demographic +
      preference.score * this.weights.preference +
      semantic.score * this.weights.semantic +
      growth_potential.score * this.weights.growth_potential
    )

    // Combine all reasons and concerns
    const allReasons = [
      ...spiritual.reasons,
      ...lifestyle.reasons,
      ...psychological.reasons,
      ...demographic.reasons,
      ...preference.reasons,
      ...semantic.reasons,
      ...growth_potential.reasons
    ]

    const allConcerns = [
      ...spiritual.concerns,
      ...lifestyle.concerns,
      ...psychological.concerns,
      ...demographic.concerns,
      ...preference.concerns,
      ...semantic.concerns,
      ...growth_potential.concerns
    ]

    const uniqueStrengths = this.identifyUniqueMatchStrengths(user, target)

    return {
      total: Math.min(total, 99), // Cap at 99%
      breakdown: {
        spiritual: spiritual.score,
        lifestyle: lifestyle.score,
        psychological: psychological.score,
        demographic: demographic.score,
        preference: preference.score,
        semantic: semantic.score,
        growth_potential: growth_potential.score
      },
      reasons: allReasons.slice(0, 8), // Top 8 reasons
      concerns: allConcerns.slice(0, 4), // Top 4 concerns
      unique_strengths: uniqueStrengths
    }
  }

  /**
   * Deep spiritual compatibility analysis
   */
  private calculateSpiritualCompatibility(user: UserProfile, target: UserProfile) {
    let score = 0
    const reasons: string[] = []
    const concerns: string[] = []

    // Core spiritual practices alignment (25 points)
    if (user.daily_practices && target.daily_practices) {
      const userPractices = Array.isArray(user.daily_practices) ? user.daily_practices : []
      const targetPractices = Array.isArray(target.daily_practices) ? target.daily_practices : []
      const commonPractices = userPractices.filter(p => targetPractices.includes(p))
      const practiceScore = Math.min((commonPractices.length / Math.max(userPractices.length, targetPractices.length)) * 25, 25)
      score += practiceScore

      if (commonPractices.length >= 2) {
        reasons.push(`Share ${commonPractices.length} spiritual practices: ${commonPractices.slice(0, 2).join(', ')}`)
      } else if (commonPractices.length === 1) {
        reasons.push(`Both practice ${commonPractices[0]}`)
      } else if (userPractices.length > 0 && targetPractices.length > 0) {
        concerns.push('Different spiritual practices - could bring diversity or require adjustment')
      }
    }

    // Spiritual organization alignment (20 points)
    if (user.spiritual_org && target.spiritual_org) {
      const userOrgs = Array.isArray(user.spiritual_org) ? user.spiritual_org : []
      const targetOrgs = Array.isArray(target.spiritual_org) ? target.spiritual_org : []
      const commonOrgs = userOrgs.filter(org => targetOrgs.includes(org))
      const orgScore = Math.min((commonOrgs.length / Math.max(userOrgs.length, targetOrgs.length)) * 20, 20)
      score += orgScore

      if (commonOrgs.length > 0) {
        reasons.push(`Connected through ${commonOrgs[0]}${commonOrgs.length > 1 ? ` and ${commonOrgs.length - 1} other organization(s)` : ''}`)
      }
    }

    // Temple visit frequency compatibility (15 points)
    const templeCompatibility = this.calculateTempleCompatibility(user.temple_visit_freq, target.temple_visit_freq)
    score += templeCompatibility.score
    if (templeCompatibility.reason) reasons.push(templeCompatibility.reason)
    if (templeCompatibility.concern) concerns.push(templeCompatibility.concern)

    // Diet spiritual alignment (20 points)
    const dietCompatibility = this.calculateDietCompatibility(user.diet, target.diet)
    score += dietCompatibility.score
    if (dietCompatibility.reason) reasons.push(dietCompatibility.reason)
    if (dietCompatibility.concern) concerns.push(dietCompatibility.concern)

    // Artha vs Moksha philosophy alignment (20 points)
    const philosophyScore = this.calculatePhilosophyAlignment(user.artha_vs_moksha, target.artha_vs_moksha)
    score += philosophyScore.score
    if (philosophyScore.reason) reasons.push(philosophyScore.reason)
    if (philosophyScore.concern) concerns.push(philosophyScore.concern)

    return { score: Math.min(score, 100), reasons, concerns }
  }

  /**
   * Lifestyle compatibility analysis
   */
  private calculateLifestyleCompatibility(user: UserProfile, target: UserProfile) {
    let score = 40 // Base lifestyle score
    const reasons: string[] = []
    const concerns: string[] = []

    // Professional compatibility (25 points)
    const professionMatch = this.calculateProfessionCompatibility(user.profession, target.profession, user.education, target.education)
    score += professionMatch.score
    if (professionMatch.reason) reasons.push(professionMatch.reason)

    // Income bracket compatibility (15 points)
    const incomeMatch = this.calculateIncomeCompatibility(user.annual_income, target.annual_income)
    score += incomeMatch.score
    if (incomeMatch.reason) reasons.push(incomeMatch.reason)
    if (incomeMatch.concern) concerns.push(incomeMatch.concern)

    // Vanaprastha interest alignment (20 points)
    const vanaprasthaScore = this.calculateVanaprasthaCompatibility(user.vanaprastha_interest, target.vanaprastha_interest)
    score += vanaprasthaScore.score
    if (vanaprasthaScore.reason) reasons.push(vanaprasthaScore.reason)
    if (vanaprasthaScore.concern) concerns.push(vanaprasthaScore.concern)

    return { score: Math.min(score, 100), reasons, concerns }
  }

  /**
   * Psychological compatibility analysis
   */
  private calculatePsychologicalCompatibility(user: UserProfile, target: UserProfile) {
    let score = 50 // Base psychological score
    const reasons: string[] = []
    const concerns: string[] = []

    // Analyze psychological indicators from profile completeness and choices
    const userCompleteness = this.calculateProfileDepth(user)
    const targetCompleteness = this.calculateProfileDepth(target)
    
    // Similar profile depth suggests similar commitment levels
    const depthDifference = Math.abs(userCompleteness - targetCompleteness)
    if (depthDifference < 15) {
      score += 15
      reasons.push('Similar levels of profile thoughtfulness and commitment')
    } else if (depthDifference > 30) {
      concerns.push('Different levels of engagement with the platform')
    }

    // Spiritual quote analysis for depth
    if (user.favorite_spiritual_quote && target.favorite_spiritual_quote) {
      const quoteLengthDiff = Math.abs(user.favorite_spiritual_quote.length - target.favorite_spiritual_quote.length)
      if (quoteLengthDiff < 50) {
        score += 10
        reasons.push('Similar spiritual expression styles')
      }
    }

    // About me analysis for communication style
    if (user.about_me && target.about_me) {
      const aboutDiff = Math.abs(user.about_me.length - target.about_me.length)
      if (aboutDiff < 100) {
        score += 10
        reasons.push('Compatible communication styles')
      }
    }

    return { score: Math.min(score, 100), reasons, concerns }
  }

  /**
   * Demographic compatibility analysis
   */
  private calculateDemographicCompatibility(user: UserProfile, target: UserProfile) {
    let score = 0
    const reasons: string[] = []
    const concerns: string[] = []

    // Age compatibility (40 points)
    if (user.birthdate && target.birthdate) {
      const userAge = this.calculateAge(user.birthdate)
      const targetAge = this.calculateAge(target.birthdate)
      const ageDiff = Math.abs(userAge - targetAge)
      
      if (ageDiff <= 2) {
        score += 40
        reasons.push('Very close in age')
      } else if (ageDiff <= 5) {
        score += 30
        reasons.push('Similar age group')
      } else if (ageDiff <= 8) {
        score += 20
        reasons.push('Compatible age range')
      } else if (ageDiff > 12) {
        concerns.push('Significant age difference may affect life stage alignment')
      }
    }

    // Location compatibility (35 points)
    if (user.city_id === target.city_id) {
      score += 35
      reasons.push('Both in the same city')
    } else if (user.state_id === target.state_id) {
      score += 20
      reasons.push('Same state - manageable distance')
    } else if (user.country_id === target.country_id) {
      score += 10
      reasons.push('Same country')
    } else {
      concerns.push('Long distance relationship considerations')
    }

    // Height compatibility (25 points)
    const heightScore = this.calculateHeightCompatibility(user, target)
    score += heightScore.score
    if (heightScore.reason) reasons.push(heightScore.reason)

    return { score: Math.min(score, 100), reasons, concerns }
  }

  /**
   * User preference matching - now using AI-based compatibility
   */
  private calculatePreferenceCompatibility(user: UserProfile, target: UserProfile) {
    let score = 70 // Base compatibility score for AI matching
    const reasons: string[] = []
    const concerns: string[] = []

    // AI-based preference analysis using ideal_partner_notes
    if (user.ideal_partner_notes && user.ideal_partner_notes.length > 50) {
      score += 20
      reasons.push('Your detailed partner preferences help our AI find better matches')
    }

    // Basic demographic compatibility without rigid constraints
    if (user.birthdate && target.birthdate) {
      const userAge = this.calculateAge(user.birthdate)
      const targetAge = this.calculateAge(target.birthdate)
      const ageDiff = Math.abs(userAge - targetAge)
      
      if (ageDiff <= 5) {
        score += 10
        reasons.push('Similar age group for life stage compatibility')
      }
    }

    return { score: Math.min(score, 100), reasons, concerns }
  }

  /**
   * Semantic text analysis compatibility
   */
  private calculateSemanticCompatibility(user: UserProfile, target: UserProfile) {
    let score = 50 // Base semantic score
    const reasons: string[] = []
    const concerns: string[] = []

    // Analyze spiritual quotes for philosophical alignment
    if (user.favorite_spiritual_quote && target.favorite_spiritual_quote) {
      const userQuote = user.favorite_spiritual_quote.toLowerCase()
      const targetQuote = target.favorite_spiritual_quote.toLowerCase()
      
      // Check for common spiritual themes
      const spiritualKeywords = ['love', 'peace', 'meditation', 'dharma', 'karma', 'soul', 'divine', 'consciousness', 'enlightenment', 'truth', 'wisdom', 'compassion']
      const userKeywords = spiritualKeywords.filter(keyword => userQuote.includes(keyword))
      const targetKeywords = spiritualKeywords.filter(keyword => targetQuote.includes(keyword))
      const commonKeywords = userKeywords.filter(keyword => targetKeywords.includes(keyword))
      
      if (commonKeywords.length >= 2) {
        score += 30
        reasons.push('Similar spiritual themes in favorite quotes')
      } else if (commonKeywords.length === 1) {
        score += 15
        reasons.push('Some alignment in spiritual philosophy')
      }
    }

    // Analyze about me and ideal partner descriptions
    const semanticSimilarity = this.calculateTextSimilarity(user.about_me, target.about_me)
    if (semanticSimilarity > 0.3) {
      score += 20
      reasons.push('Similar self-expression and values')
    }

    return { score: Math.min(score, 100), reasons, concerns }
  }

  /**
   * Growth potential analysis for long-term compatibility
   */
  private calculateGrowthPotential(user: UserProfile, target: UserProfile) {
    let score = 60 // Base growth potential
    const reasons: string[] = []
    const concerns: string[] = []

    // Spiritual growth alignment
    const userSpiritualDepth = this.assessSpiritualDepth(user)
    const targetSpiritualDepth = this.assessSpiritualDepth(target)
    
    if (Math.abs(userSpiritualDepth - targetSpiritualDepth) < 20) {
      score += 25
      reasons.push('Similar spiritual maturity levels for mutual growth')
    } else if (Math.abs(userSpiritualDepth - targetSpiritualDepth) > 40) {
      concerns.push('Different spiritual journey stages may require patience')
    }

    // Professional growth compatibility
    if (user.profession && target.profession && user.education && target.education) {
      const professionalSynergy = this.calculateProfessionalSynergy(user.profession, target.profession, user.education, target.education)
      score += professionalSynergy
      if (professionalSynergy > 10) {
        reasons.push('Complementary professional backgrounds for mutual support')
      }
    }

    return { score: Math.min(score, 100), reasons, concerns }
  }

  // Helper methods for specific compatibility calculations

  private calculateTempleCompatibility(userFreq?: string, targetFreq?: string) {
    const score = 0
    let reason = ''
    let concern = ''

    if (!userFreq || !targetFreq) return { score, reason, concern }

    const freqScore: Record<string, number> = {
      'Daily': 5, 'Weekly': 4, 'Monthly': 3, 'Rarely': 2, 'Never': 1
    }

    const userScore = freqScore[userFreq] || 3
    const targetScore = freqScore[targetFreq] || 3
    const diff = Math.abs(userScore - targetScore)

    if (diff === 0) {
      return { score: 15, reason: `Both visit temples ${userFreq.toLowerCase()}`, concern }
    } else if (diff === 1) {
      return { score: 10, reason: 'Similar temple visit patterns', concern }
    } else if (diff >= 3) {
      return { score: 2, reason: '', concern: 'Very different approaches to temple worship' }
    }

    return { score: 5, reason: 'Moderately different temple visit preferences', concern }
  }

  private calculateDietCompatibility(userDiet?: string, targetDiet?: string) {
    if (!userDiet || !targetDiet) return { score: 0, reason: '', concern: '' }

    if (userDiet === targetDiet) {
      return { score: 20, reason: `Both follow ${userDiet} diet`, concern: '' }
    }

    // Compatible diets
    const compatibleDiets: Record<string, string[]> = {
      'Vegetarian': ['Vegan', 'Vegetarian'],
      'Vegan': ['Vegan', 'Vegetarian'],
      'Eggetarian': ['Vegetarian', 'Eggetarian'],
      'Non-Vegetarian': ['Eggetarian', 'Non-Vegetarian']
    }

    if (compatibleDiets[userDiet]?.includes(targetDiet)) {
      return { score: 12, reason: 'Compatible dietary preferences', concern: '' }
    }

    return { 
      score: 3, 
      reason: '', 
      concern: 'Different dietary preferences may require accommodation' 
    }
  }

  private calculatePhilosophyAlignment(userPhilosophy?: string, targetPhilosophy?: string) {
    if (!userPhilosophy || !targetPhilosophy) return { score: 10, reason: '', concern: '' }

    if (userPhilosophy === targetPhilosophy) {
      return { 
        score: 20, 
        reason: `Both embrace ${userPhilosophy.toLowerCase()} approach to life`, 
        concern: '' 
      }
    }

    // Balance is compatible with both
    if (userPhilosophy === 'Balance' || targetPhilosophy === 'Balance') {
      return { 
        score: 15, 
        reason: 'Complementary life philosophies with balance', 
        concern: '' 
      }
    }

    return { 
      score: 5, 
      reason: '', 
      concern: 'Different life philosophies may require understanding' 
    }
  }

  private calculateAge(birthdate: string): number {
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  private calculateProfileDepth(profile: UserProfile): number {
    let depth = 0
    
    // Basic info (20 points)
    if (profile.first_name) depth += 2
    if (profile.last_name) depth += 2
    if (profile.about_me && profile.about_me.length > 50) depth += 8
    if (profile.ideal_partner_notes && profile.ideal_partner_notes.length > 30) depth += 8

    // Spiritual depth (40 points)
    if (profile.spiritual_org && Array.isArray(profile.spiritual_org) && profile.spiritual_org.length > 0) depth += 10
    if (profile.daily_practices && Array.isArray(profile.daily_practices) && profile.daily_practices.length > 1) depth += 10
    if (profile.favorite_spiritual_quote && profile.favorite_spiritual_quote.length > 20) depth += 10
    if (profile.temple_visit_freq) depth += 5
    if (profile.artha_vs_moksha) depth += 5

    // Professional depth (20 points)
    if (profile.education) depth += 5
    if (profile.profession) depth += 5
    if (profile.annual_income) depth += 5
    if (profile.user_photos && Array.isArray(profile.user_photos) && profile.user_photos.length > 1) depth += 5

    // AI preference completeness (20 points)
    if (profile.ideal_partner_notes && profile.ideal_partner_notes.length > 50) depth += 10
    if (profile.ideal_partner_notes && profile.ideal_partner_notes.length > 150) depth += 10

    return depth
  }

  private calculateHeightCompatibility(user: UserProfile, target: UserProfile) {
    let score = 15 // Base height score
    let reason = ''

    if (!user.height_ft || !user.height_in || !target.height_ft || !target.height_in) {
      return { score, reason }
    }

    const userHeightInches = (user.height_ft * 12) + user.height_in
    const targetHeightInches = (target.height_ft * 12) + target.height_in
    const heightDiff = Math.abs(userHeightInches - targetHeightInches)

    if (heightDiff <= 3) {
      score = 25
      reason = 'Similar heights'
    } else if (heightDiff <= 6) {
      score = 20
      reason = 'Compatible height difference'
    } else if (heightDiff > 12) {
      score = 5
      reason = 'Significant height difference'
    }

    return { score, reason }
  }

  private calculateProfessionCompatibility(userProf?: string, targetProf?: string, userEdu?: string, targetEdu?: string) {
    let score = 10 // Base score
    let reason = ''

    if (!userProf || !targetProf) return { score, reason }

    // Same profession
    if (userProf.toLowerCase().includes(targetProf.toLowerCase()) || 
        targetProf.toLowerCase().includes(userProf.toLowerCase())) {
      return { score: 25, reason: 'Similar professional backgrounds' }
    }

    // Compatible professions (professional fields that work well together)
    const compatibleFields = [
      ['doctor', 'nurse', 'healthcare', 'medical'],
      ['teacher', 'professor', 'education', 'academic'],
      ['engineer', 'architect', 'developer', 'technical'],
      ['business', 'finance', 'banking', 'consulting'],
      ['artist', 'designer', 'creative', 'media']
    ]

    for (const field of compatibleFields) {
      const userInField = field.some(f => userProf.toLowerCase().includes(f))
      const targetInField = field.some(f => targetProf.toLowerCase().includes(f))
      if (userInField && targetInField) {
        return { score: 20, reason: 'Complementary professional fields' }
      }
    }

    return { score: 12, reason: 'Different but potentially complementary careers' }
  }

  private calculateIncomeCompatibility(userIncome?: string, targetIncome?: string) {
    let score = 10
    let reason = ''
    let concern = ''

    if (!userIncome || !targetIncome) return { score, reason, concern }

    // Income ranges for comparison
    const incomeRanges: Record<string, number> = {
      'Below 2 Lakhs': 1,
      '2-5 Lakhs': 2,
      '5-10 Lakhs': 3,
      '10-20 Lakhs': 4,
      '20-50 Lakhs': 5,
      'Above 50 Lakhs': 6
    }

    const userRange = incomeRanges[userIncome] || 3
    const targetRange = incomeRanges[targetIncome] || 3
    const diff = Math.abs(userRange - targetRange)

    if (diff === 0) {
      return { score: 15, reason: 'Similar income levels', concern }
    } else if (diff === 1) {
      return { score: 12, reason: 'Compatible income ranges', concern }
    } else if (diff >= 3) {
      return { 
        score: 5, 
        reason: '', 
        concern: 'Significant income difference may affect lifestyle compatibility' 
      }
    }

    return { score: 8, reason: 'Moderate income difference', concern }
  }

  private calculateVanaprasthaCompatibility(userInterest?: string, targetInterest?: string) {
    if (!userInterest || !targetInterest) return { score: 10, reason: '', concern: '' }

    if (userInterest === targetInterest) {
      return { 
        score: 20, 
        reason: `Both ${userInterest === 'yes' ? 'interested in' : userInterest === 'no' ? 'not interested in' : 'open to'} Vanaprastha lifestyle`, 
        concern: '' 
      }
    }

    // Open is compatible with both yes and no
    if (userInterest === 'open' || targetInterest === 'open') {
      return { score: 15, reason: 'Flexible approach to Vanaprastha lifestyle', concern: '' }
    }

    // Yes vs No mismatch
    return { 
      score: 5, 
      reason: '', 
      concern: 'Different views on Vanaprastha lifestyle may need discussion' 
    }
  }

  private calculateTextSimilarity(text1?: string, text2?: string): number {
    if (!text1 || !text2) return 0

    const words1 = text1.toLowerCase().split(/\s+/)
    const words2 = text2.toLowerCase().split(/\s+/)
    
    const commonWords = words1.filter(word => words2.includes(word) && word.length > 3)
    const totalUniqueWords = new Set([...words1, ...words2]).size
    
    return commonWords.length / totalUniqueWords
  }

  private assessSpiritualDepth(profile: UserProfile): number {
    let depth = 0

    // Spiritual practices diversity and frequency
    if (profile.daily_practices && Array.isArray(profile.daily_practices)) {
      depth += profile.daily_practices.length * 10
    }

    // Temple visit frequency shows commitment
    const templeScores: Record<string, number> = {
      'Daily': 25, 'Weekly': 20, 'Monthly': 15, 'Rarely': 10, 'Never': 5
    }
    depth += templeScores[profile.temple_visit_freq || 'Monthly'] || 15

    // Spiritual organization involvement
    if (profile.spiritual_org && Array.isArray(profile.spiritual_org)) {
      depth += profile.spiritual_org.length * 8
    }

    // Philosophy depth
    if (profile.artha_vs_moksha) depth += 15
    if (profile.vanaprastha_interest && profile.vanaprastha_interest !== 'open') depth += 10

    // Quote depth indicates contemplation
    if (profile.favorite_spiritual_quote) {
      depth += Math.min(profile.favorite_spiritual_quote.length / 5, 20)
    }

    return Math.min(depth, 100)
  }

  private calculateProfessionalSynergy(userProf: string, targetProf: string, userEdu: string, targetEdu: string): number {
    // Synergistic combinations that support each other's growth
    const synergyPairs = [
      ['doctor', 'pharmacist'], ['teacher', 'counselor'], ['engineer', 'designer'],
      ['business', 'marketing'], ['lawyer', 'social worker'], ['artist', 'writer']
    ]

    for (const [prof1, prof2] of synergyPairs) {
      if ((userProf.toLowerCase().includes(prof1) && targetProf.toLowerCase().includes(prof2)) ||
          (userProf.toLowerCase().includes(prof2) && targetProf.toLowerCase().includes(prof1))) {
        return 15
      }
    }

    return 5
  }

  private identifyUniqueMatchStrengths(user: UserProfile, target: UserProfile): string[] {
    const strengths: string[] = []

    // Same spiritual organizations
    if (user.spiritual_org && target.spiritual_org) {
      const userOrgs = Array.isArray(user.spiritual_org) ? user.spiritual_org : []
      const targetOrgs = Array.isArray(target.spiritual_org) ? target.spiritual_org : []
      const commonOrgs = userOrgs.filter(org => targetOrgs.includes(org))
      if (commonOrgs.length > 0) {
        strengths.push(`Spiritual community through ${commonOrgs[0]}`)
      }
    }

    // Similar professional ambitions
    if (user.annual_income && target.annual_income) {
      const incomeRanges: Record<string, number> = {
        'Below 2 Lakhs': 1, '2-5 Lakhs': 2, '5-10 Lakhs': 3,
        '10-20 Lakhs': 4, '20-50 Lakhs': 5, 'Above 50 Lakhs': 6
      }
      const userRange = incomeRanges[user.annual_income]
      const targetRange = incomeRanges[target.annual_income]
      if (userRange && targetRange && Math.abs(userRange - targetRange) <= 1) {
        strengths.push('Similar professional achievement levels')
      }
    }

    // Complementary spiritual philosophies
    if (user.artha_vs_moksha && target.artha_vs_moksha) {
      if (user.artha_vs_moksha === 'Balance' || target.artha_vs_moksha === 'Balance') {
        strengths.push('Balanced approach to material and spiritual life')
      }
    }

    // Geographic compatibility
    if (user.city_id === target.city_id) {
      strengths.push('Local connection - easy to meet and build relationship')
    } else if (user.state_id === target.state_id) {
      strengths.push('Regional familiarity and cultural alignment')
    }

    return strengths.slice(0, 3) // Top 3 unique strengths
  }

  /**
   * Get profiles sorted by compatibility with advanced ranking including profile quality scores
   */
  async sortProfilesByCompatibility(user: UserProfile, profiles: UserProfile[]): Promise<Array<UserProfile & { compatibility: CompatibilityScore }>> {
    const profilesWithScores = profiles.map(profile => ({
      ...profile,
      compatibility: this.calculateCompatibility(user, profile)
    }))

    // Apply profile quality scoring and account status boosts
    const rankedProfiles = profilesWithScores.map((profile, index) => {
      let finalScore = profile.compatibility.total
      
      // Apply profile quality boost/penalty (significant impact on ranking)
      const profileScore = (profile as any).profile_score || 5 // Default to 5 if not set
      if (profileScore > 5) {
        // High quality profiles (6-10) get significant boost
        const qualityBoost = Math.min((profileScore - 5) * 1.5, 7) // Max 7 point boost
        finalScore = Math.min(finalScore + qualityBoost, 99)
      } else if (profileScore < 5) {
        // Low quality profiles (1-4) get penalty
        const qualityPenalty = (5 - profileScore) * 2 // Max 8 point penalty
        finalScore = Math.max(finalScore - qualityPenalty, 10) // Min 10% score
      }
      
      // Account status boost (smaller impact now that quality scoring is primary)
      const accountStatus = (profile as any).account_status
      if (accountStatus === 'elite') {
        finalScore = Math.min(finalScore + 1, 99)
      } else if (accountStatus === 'premium') {
        finalScore = Math.min(finalScore + 0.5, 99)
      }

      return {
        ...profile,
        compatibility: {
          ...profile.compatibility,
          total: Math.round(finalScore)
        },
        profile_quality_boost: profileScore > 5 ? 
          `+${Math.min((profileScore - 5) * 1.5, 7).toFixed(1)}` : 
          profileScore < 5 ? `-${((5 - profileScore) * 2).toFixed(1)}` : '0'
      }
    })

    // Advanced sorting algorithm with profile quality priority
    return rankedProfiles.sort((a, b) => {
      // Primary sort by final compatibility score (includes quality boost)
      if (a.compatibility.total !== b.compatibility.total) {
        return b.compatibility.total - a.compatibility.total
      }

      // Secondary sort by profile quality score
      const aProfileScore = (a as any).profile_score || 5
      const bProfileScore = (b as any).profile_score || 5
      if (aProfileScore !== bProfileScore) {
        return bProfileScore - aProfileScore
      }

      // Tertiary sort by spiritual compatibility (most important compatibility factor)
      if (a.compatibility.breakdown.spiritual !== b.compatibility.breakdown.spiritual) {
        return b.compatibility.breakdown.spiritual - a.compatibility.breakdown.spiritual
      }

      // Quaternary sort by number of unique strengths
      return b.compatibility.unique_strengths.length - a.compatibility.unique_strengths.length
    })
  }
}

// Export singleton instance
export const matchingEngine = new AdvancedMatchingEngine() 