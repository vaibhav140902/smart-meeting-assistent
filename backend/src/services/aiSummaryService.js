const { OpenAI } = require('openai');
const logger = require('../middleware/logger');

class AISummaryService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Generate meeting summary
  async generateSummary(transcript, meetingTitle = '') {
    try {
      const prompt = `Generate a concise and professional summary of the following meeting transcript.

Meeting Title: ${meetingTitle}

Transcript:
${transcript}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Discussion Points (bullet list)
3. Decisions Made (bullet list)
4. Next Steps (bullet list)
5. Follow-up Items (bullet list)`;

      const response = await this.openai.chat.completions.create({
        model: process.env.SUMMARY_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional meeting assistant. Create clear, concise, and actionable meeting summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: process.env.SUMMARY_TEMPERATURE || 0.7,
        max_tokens: process.env.SUMMARY_MAX_TOKENS || 500,
      });

      return {
        summary: response.choices[0].message.content,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      logger.error('Summary generation error:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  // Extract action items
  async extractActionItems(transcript, participants = []) {
    try {
      const participantList = participants.length > 0 ? participants.join(', ') : 'team members';

      const prompt = `Extract all action items from the following meeting transcript. For each action item, identify:
1. What needs to be done
2. Who is responsible
3. When it should be completed

Participants: ${participantList}

Transcript:
${transcript}

Return the action items as a JSON array with this structure:
[
  {
    "title": "Action item description",
    "assignee": "Person responsible",
    "dueDate": "YYYY-MM-DD or relative date like 'Next Friday'",
    "priority": "high/medium/low",
    "description": "Detailed description"
  }
]

Only return valid JSON.`;

      const response = await this.openai.chat.completions.create({
        model: process.env.ACTION_ITEM_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying action items from meeting transcripts. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: process.env.ACTION_ITEM_TEMPERATURE || 0.5,
        max_tokens: process.env.ACTION_ITEM_MAX_TOKENS || 300,
      });

      try {
        const content = response.choices[0].message.content;
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[([\s\S]*?)\]/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        return JSON.parse(jsonStr);
      } catch (parseError) {
        logger.warn('Failed to parse action items JSON:', parseError);
        return [];
      }
    } catch (error) {
      logger.error('Action item extraction error:', error);
      throw new Error(`Failed to extract action items: ${error.message}`);
    }
  }

  // Generate key highlights
  async generateKeyHighlights(transcript) {
    try {
      const prompt = `Extract the 5 most important highlights or key points from this meeting transcript:

${transcript}

Provide them as a JSON array with this structure:
[
  {
    "highlight": "The key point",
    "importance": "high/medium/low",
    "context": "Brief context"
  }
]

Only return valid JSON.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying key highlights and important points from meetings.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      try {
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[([\s\S]*?)\]/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        return JSON.parse(jsonStr);
      } catch (parseError) {
        logger.warn('Failed to parse highlights JSON:', parseError);
        return [];
      }
    } catch (error) {
      logger.error('Key highlights generation error:', error);
      throw new Error(`Failed to generate highlights: ${error.message}`);
    }
  }

  // Generate meeting questions
  async generateFollowUpQuestions(transcript) {
    try {
      const prompt = `Based on this meeting transcript, generate 3-5 follow-up questions that should be addressed:

${transcript}

Provide them as a JSON array with this structure:
[
  {
    "question": "The follow-up question",
    "context": "Why this question matters",
    "assignee": "Who should address this"
  }
]

Only return valid JSON.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at generating thoughtful follow-up questions for meetings.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      try {
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[([\s\S]*?)\]/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        return JSON.parse(jsonStr);
      } catch (parseError) {
        logger.warn('Failed to parse follow-up questions JSON:', parseError);
        return [];
      }
    } catch (error) {
      logger.error('Follow-up questions generation error:', error);
      throw new Error(`Failed to generate follow-up questions: ${error.message}`);
    }
  }
}

module.exports = new AISummaryService();