/**
 * Mood and Topic Detection - Rule-based classification
 * Detects user mood and topics from text input
 */

/**
 * Detect mood and topics from user message
 * @param {string} text - User's message
 * @returns {{mood: string, topics: string[]}} - Detected mood and topic tags
 */
export function detectMoodAndTopics(text) {
  if (!text || typeof text !== 'string') {
    return {
      mood: 'neutral',
      topics: []
    };
  }

  const lowerText = text.toLowerCase();

  // Mood Detection
  let mood = 'neutral';

  // Sad indicators
  if (lowerText.match(/\b(sad|tired|lonely|broken|down|depressed|upset|worried|anxious|frustrated|disappointed|hurt|sadness|melancholy|gloomy|unhappy|miserable)\b/)) {
    mood = 'sad';
  }

  // Angry indicators (check after sad to prioritize)
  if (lowerText.match(/\b(angry|pissed|irritated|mad|furious|annoyed|rage|hate|frustrated|aggressive|hostile|outraged)\b/)) {
    mood = 'angry';
  }

  // Stressed indicators
  if (lowerText.match(/\b(stressed|pressure|overwhelmed|busy|deadline|exhausted|burnout|anxious|nervous|worried|tense|panicked|rushed)\b/)) {
    mood = 'stressed';
  }

  // Happy indicators
  if (lowerText.match(/\b(happy|excited|good|great|awesome|amazing|wonderful|joy|glad|pleased|delighted|cheerful|ecstatic|thrilled|fantastic|excellent)\b/)) {
    mood = 'happy';
  }

  // Topic Detection
  const topics = [];

  // AI/Technology topics
  if (lowerText.match(/\b(ai|artificial intelligence|machine learning|ml|neural|algorithm|coding|programming|code|project|software|tech|technology|computer|python|javascript|react|vscode|github|developer|development|debug|bug|api|framework|library)\b/)) {
    topics.push('ai');
  }

  // College/Education topics
  if (lowerText.match(/\b(college|university|exam|test|marks|grade|vtu|assignment|homework|study|studying|lecture|professor|teacher|class|semester|course|subject|academic|education|student|tuition|scholarship)\b/)) {
    topics.push('college');
  }

  // Relationships topics
  if (lowerText.match(/\b(family|parents|mom|dad|mother|father|friend|friends|girlfriend|boyfriend|relationship|love|dating|partner|spouse|wife|husband|sibling|brother|sister|relative|social|people|person)\b/)) {
    topics.push('relationships');
  }

  // Health topics
  if (lowerText.match(/\b(health|gym|workout|exercise|fitness|sleep|sleeping|tired|sick|ill|doctor|medicine|pain|headache|stress|diet|nutrition|weight|calories|muscle|training|yoga|meditation|mental health|therapy)\b/)) {
    topics.push('health');
  }

  // Work/Career topics
  if (lowerText.match(/\b(work|job|career|interview|salary|boss|colleague|office|meeting|presentation|promotion|resume|cv|employment|employee|employer|business|company|corporate|professional|client|customer)\b/)) {
    topics.push('work');
  }

  // Finance topics
  if (lowerText.match(/\b(money|salary|income|expense|budget|save|saving|spend|spending|bank|loan|debt|financial|investment|stock|trading|credit|debit|payment|bill|rent|mortgage|tax)\b/)) {
    topics.push('finance');
  }

  // Entertainment topics
  if (lowerText.match(/\b(movie|music|song|game|gaming|play|watch|netflix|youtube|spotify|entertainment|fun|hobby|series|show|tv|television|video|stream|streaming|concert|festival|party|celebration)\b/)) {
    topics.push('entertainment');
  }

  return {
    mood: mood,
    topicTags: topics  // Backend expects 'topicTags' for compatibility
  };
}
