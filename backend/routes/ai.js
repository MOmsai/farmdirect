const express = require('express');
const router = express.Router();

const { generateAIResponse } = require('../services/aiService');

const {buildDemandAnalysis,} = require('../services/demandAnalysis');

const {buildPricingAnalysis,} = require('../services/pricingInsights');

const {buildBudgetAnalysis,} = require('../services/budgetAnalysis');

const {buildSustainabilityAnalysis,}= require('../services/sustainabilityAnalysis');
const {buildFarmAssistantContext,} = require('../services/farmAssistant');

const {buildSeasonalPlanningAnalysis,} = require('../services/seasonalPlanning');

/*

|--------------------------------------------------------------------------
| Authentication Middleware
|--------------------------------------------------------------------------
*/

const auth = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const jwt = require('jsonwebtoken');

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // JWT payload is:
    // { user: { id, role, name, email } }
    req.user = decoded.user;

    next();
  } catch (error) {
    console.error('AI auth error:', error.message);

    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
};

/*
|--------------------------------------------------------------------------
| Test AI Endpoint
|--------------------------------------------------------------------------
| GET /api/ai/test
|--------------------------------------------------------------------------
*/

router.get('/test', auth, async (req, res) => {
  try {
    const response = await generateAIResponse(
      'You are the AI assistant for FarmDirect, an agricultural marketplace. Respond with one short sentence introducing yourself.',
      {
        temperature: 0.3,
        maxOutputTokens: 100,
      }
    );

    return res.json({
      message: 'AI service is working successfully.',
      response,
    });
  } catch (error) {
    console.error('AI test error:', error);

    return res.status(500).json({
      message: 'AI service failed.',
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| AI DEMAND ANALYSIS
|--------------------------------------------------------------------------
| GET /api/ai/demand-analysis
|--------------------------------------------------------------------------
*/

router.get(
  '/demand-analysis',
  auth,
  async (req, res) => {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        message:
          'AI Demand Analysis is available to farmers only.',
      });
    }

    try {
      /*
       * Optional period:
       *
       * /api/ai/demand-analysis?days=30
       */

      const days =
        Number(req.query.days) || 30;

      /*
       * Get actual FarmDirect data.
       */

      const analysisData =
        await buildDemandAnalysis(
          req.user.id,
          days
        );

      /*
       * If farmer has no products.
       */

      if (
        analysisData.summary.products === 0
      ) {
        return res.json({
          message:
            'No products found for demand analysis.',
          data: analysisData,
          insights: null,
        });
      }

      /*
       * Prepare Gemini prompt.
       *
       * Gemini interprets database data.
       * It does NOT create the numerical data.
       */

      const prompt = `
You are the AI Demand Analysis assistant for FarmDirect,
a direct farm-to-customer marketplace.

Analyze the farmer's actual FarmDirect sales and inventory
data provided below.

IMPORTANT RULES:

1. Use ONLY the supplied data.
2. Do not invent sales numbers, prices, orders, or trends.
3. Clearly distinguish actual data from AI interpretation.
4. Do not claim that a product will definitely sell more.
5. Do not provide guaranteed financial predictions.
6. Give practical, concise recommendations.
7. Mention when there is insufficient historical data.
8. Consider current stock when discussing demand.
9. Treat "unitsSold" as kilograms because FarmDirect
   products are currently measured in kg.
10. Return a useful farmer-friendly response.

DATA:

${JSON.stringify(
  analysisData,
  null,
  2
)}

Return your answer using exactly these sections:

### Demand Overview
Briefly summarize the observed demand from the supplied data.

### High-Demand Products
Identify products with the highest observed sales during
the selected period. Include the actual units sold.

### Stock Considerations
Identify products where current stock may need attention,
based only on the supplied stock and sales information.

### Products With No Recent Sales
Mention products with zero sales during the selected period,
if any.

### Practical Recommendations
Give 3 to 5 practical recommendations based on the data.

### Important Note
Briefly state that the analysis is based on FarmDirect's
recorded sales during the selected period and is not a
guarantee of future demand.
`;

      const insights =
        await generateAIResponse(
          prompt,
          {
            maxOutputTokens: 1200,

            systemInstruction:
              'You are a helpful agricultural marketplace analytics assistant. Be factual, concise, transparent about uncertainty, and never invent database values.',
          }
        );

      return res.json({
        message:
          'AI demand analysis generated successfully.',

        period: {
          days:
            analysisData.periodDays,

          start:
            analysisData.periodStart,

          end:
            analysisData.periodEnd,
        },

        data: analysisData,

        insights,
      });
    } catch (error) {
      console.error(
        'AI demand analysis error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to generate AI demand analysis.',
        error:
          error.message ||
          'Unknown error',
      });
    }
  }
);

// =========================================================
// AI PRICING INSIGHTS
// GET /api/ai/pricing-insights
// =========================================================

router.get(
  '/pricing-insights',
  auth,
  async (req, res) => {
    // -----------------------------------------------------
    // FARMER ONLY
    // -----------------------------------------------------

    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        message:
          'AI Pricing Insights is available to farmers only.',
      });
    }

    try {
      const days =
        Number(req.query.days) || 30;

      // ---------------------------------------------------
      // BUILD DATABASE-GROUNDED PRICING DATA
      // ---------------------------------------------------

      const pricingData =
        await buildPricingAnalysis(
          req.user.id,
          days
        );

      // ---------------------------------------------------
      // NO PRODUCTS
      // ---------------------------------------------------

      if (
        pricingData.summary.products === 0
      ) {
        return res.json({
          message:
            'No products found for pricing analysis.',

          data: pricingData,

          insights: null,
        });
      }

      // ---------------------------------------------------
      // AI PROMPT
      // ---------------------------------------------------

      const prompt = `
You are the AI Pricing Insights assistant
for FarmDirect, a direct farm-to-customer
marketplace.

Analyze ONLY the actual FarmDirect product,
sales, revenue, inventory and pricing data
provided below.

IMPORTANT RULES:

1. Use ONLY the supplied data.

2. Do NOT invent market prices.

3. Do NOT claim to know external market prices.

4. Do NOT invent competitor prices.

5. Do NOT guarantee that changing a price
   will increase sales.

6. Clearly distinguish actual recorded data
   from AI interpretation.

7. If a product has insufficient sales data,
   explicitly mention that.

8. Consider both current stock and observed
   sales when discussing pricing.

9. Treat unitsSold as kilograms.

10. Keep recommendations practical and
    farmer-friendly.

11. Do not provide guaranteed financial
    outcomes.

12. A higher or lower current price compared
    with historical price does NOT automatically
    mean the price is wrong.

13. Do not recommend a specific price unless
    the supplied historical data provides
    sufficient basis. When possible, discuss
    pricing direction or considerations instead.

FARMDIRECT DATA:

${JSON.stringify(
  pricingData,
  null,
  2
)}

Return the analysis using exactly these sections:

### Pricing Overview

Summarize the current pricing situation using
the supplied FarmDirect data.

### Products With Strong Sales

Identify products that have meaningful recorded
sales and explain their observed pricing and
sales relationship.

Include actual numbers where useful.

### Products With Low or No Sales

Identify products with low or zero recorded sales.

Do not assume why sales are low unless the data
supports the conclusion.

### Inventory & Pricing Considerations

Discuss products where current inventory and
observed sales may be useful when reviewing
pricing.

### Pricing Recommendations

Give 3 to 5 practical pricing considerations
based ONLY on the supplied data.

Avoid guaranteed outcomes.

### Important Note

State that the analysis is based on FarmDirect's
recorded sales and prices during the selected
period and does not represent guaranteed future
market prices, demand or revenue.
`;

      // ---------------------------------------------------
      // GENERATE AI RESPONSE
      // ---------------------------------------------------

      const insights =
        await generateAIResponse(
          prompt,
          {
            maxOutputTokens: 1400,

            systemInstruction:
              `
You are a factual agricultural
marketplace pricing analytics assistant.

Use only supplied database data.

Never invent market prices,
competitor information,
future demand,
or guaranteed financial outcomes.

Clearly distinguish observed
historical data from interpretation.

Be concise and useful for farmers.
              `.trim(),
          }
        );

      // ---------------------------------------------------
      // RESPONSE
      // ---------------------------------------------------

      return res.json({
        message:
          'AI pricing insights generated successfully.',

        period: {
          days:
            pricingData.periodDays,

          start:
            pricingData.periodStart,

          end:
            pricingData.periodEnd,
        },

        data: pricingData,

        insights,
      });
    } catch (error) {
      console.error(
        'AI pricing insights error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to generate AI pricing insights.',

        error:
          error.message ||
          'Unknown error',
      });
    }
  }
);

router.get(
  '/budget-advisor',
  auth,
  async (req, res) => {
    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        message:
          'AI Budget Advisor is available to farmers only.',
      });
    }

    try {
      const budgetData =
        await buildBudgetAnalysis(
          req.user.id
        );

      if (
        budgetData.summary.totalPlans === 0
      ) {
        return res.json({
          message:
            'No saved budget plans found.',
          data: budgetData,
          insights: null,
        });
      }

      const prompt = `
You are the AI Budget Advisor for FarmDirect,
a direct farm-to-customer agricultural marketplace.

Analyze ONLY the farmer's actual saved budget
data supplied below.

IMPORTANT RULES:

1. Use ONLY the supplied data.
2. Do NOT invent expenses, revenue, yields,
   prices, or budget values.
3. Clearly distinguish calculated values from
   AI interpretation.
4. Do NOT guarantee profit or financial outcomes.
5. Do NOT claim that a farmer will definitely
   make a profit.
6. Do NOT invent external agricultural costs.
7. Do NOT use external market prices.
8. Identify areas where the budget appears
   relatively large based on the supplied data.
9. Consider total cost, expected revenue,
   expected profit, profit margin and
   break-even price.
10. If there is only one budget plan, clearly
    mention that historical comparison is
    limited.
11. Give practical and understandable advice
    for a farmer.
12. Treat expected revenue and expected profit
    as estimates, not guaranteed outcomes.
13. Do not recommend borrowing money or making
    financial commitments.
14. Do not provide guaranteed investment or
    financial advice.

FARMDIRECT BUDGET DATA:

${JSON.stringify(
  budgetData,
  null,
  2
)}

Return the response using exactly these sections:

### Budget Overview

Summarize the farmer's saved budget plans
using the supplied data.

Mention total plans, total planned cost,
expected revenue and expected profit where
available.

### Cost Breakdown

Explain the major expense categories such as
seed, fertilizer, labor, irrigation and other
costs.

Identify categories that represent relatively
large portions of the recorded costs.

### Profitability Analysis

Discuss the recorded expected revenue,
expected profit, profit margin and break-even
price.

Clearly state that these are estimates based
on the farmer's supplied assumptions.

### Budget Risks and Considerations

Identify potential areas that the farmer
should review.

Do not assume a risk exists unless it can be
reasonably connected to the supplied data.

### Practical Recommendations

Give 3 to 5 practical ways the farmer can
review or improve the budget.

Base these recommendations only on the
supplied data.

CURRENCY RULE:
All monetary values in the supplied FarmDirect budget
are in Indian Rupees (INR).

Always display monetary values using ₹ or INR.
Never use $, USD, €, or any other currency symbol.

### Important Note

State that the analysis is based on the
farmer's saved FarmDirect budget information
and that expected revenue, profit and other
calculations are estimates rather than
guaranteed future results.
`;

      const insights =
        await generateAIResponse(
          prompt,
          {
            maxOutputTokens: 1400,

            systemInstruction:
              `
You are a factual agricultural
budget analytics assistant.

Use only supplied database data.

Never invent expenses,
market prices,
future yields,
future demand,
or guaranteed profits.

Clearly distinguish
calculated budget values
from AI interpretation.

Be practical, concise,
and transparent about
uncertainty.
              `.trim(),
          }
        );

      return res.json({
        message:
          'AI budget advice generated successfully.',

        data: budgetData,

        insights,
      });
    } catch (error) {
      console.error(
        'AI budget advisor error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to generate AI budget advice.',

        error:
          error.message ||
          'Unknown error',
      });
    }
  }
);

// =========================================================
// AI SUSTAINABILITY ADVISOR
// GET /api/ai/sustainability-advisor
// =========================================================

router.get(
  '/sustainability-advisor',
  auth,
  async (req, res) => {
    // Farmer only
    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        message:
          'AI Sustainability Advisor is available to farmers only.',
      });
    }

    try {
      // ---------------------------------------------------
      // Build sustainability data from MongoDB
      // ---------------------------------------------------

      const sustainabilityData =
        await buildSustainabilityAnalysis(
          req.user.id
        );

      // ---------------------------------------------------
      // Check whether farmer has enough data
      // ---------------------------------------------------

      if (
        sustainabilityData.summary
          .totalBudgetPlans === 0 &&
        sustainabilityData.summary
          .totalProducts === 0
      ) {
        return res.json({
          message:
            'Not enough farm data available for sustainability analysis.',

          data: sustainabilityData,

          insights: null,
        });
      }

      // ---------------------------------------------------
      // Gemini Prompt
      // ---------------------------------------------------

      const prompt = `
You are the AI Sustainability Advisor for FarmDirect,
a direct farm-to-customer agricultural marketplace.

Analyze ONLY the farmer's actual FarmDirect data
provided below.

Your purpose is to provide practical sustainability
observations and recommendations related to resource
use and farming practices.

IMPORTANT RULES:

1. Use ONLY the supplied FarmDirect data.

2. Do NOT invent water usage, electricity usage,
   fuel usage, pesticide usage, fertilizer quantities,
   emissions, carbon footprint values, or environmental
   impact measurements.

3. Do NOT calculate a carbon footprint unless actual
   emissions data is supplied.

4. Do NOT claim that a farming practice is definitely
   environmentally better unless the supplied data
   supports the observation.

5. Clearly distinguish database calculations from
   AI interpretation.

6. Treat budget costs as financial indicators only.
   Do not automatically equate higher cost with higher
   environmental impact.

7. Fertilizer and irrigation costs may indicate areas
   worth reviewing, but do not assume excessive use.

8. Organic product counts indicate products marked
   "Organic" in FarmDirect. Do not claim that every
   organic product has a specific environmental impact.

9. Do NOT invent external agricultural statistics.

10. Do NOT use external market data.

11. Give practical recommendations that a farmer can
    realistically review or implement.

12. Do NOT recommend borrowing money or making financial
    commitments.

13. Do NOT guarantee environmental outcomes.

14. If important sustainability information is missing,
    clearly mention what cannot currently be measured.

15. The analysis should be useful to a farmer and easy
    to understand.

FARMDIRECT SUSTAINABILITY DATA:

${JSON.stringify(
  sustainabilityData,
  null,
  2
)}

Return the response using exactly these sections:

### Sustainability Overview

Summarize the farmer's available sustainability-related
FarmDirect data.

Mention the number of saved budget plans, land size,
recorded fertilizer and irrigation costs, expected yield,
and Organic/Non-Organic product information where
available.

### Resource Use Indicators

Discuss fertilizer and irrigation costs as areas that
may be worth reviewing.

Explain their percentage of recorded budget costs where
available.

Do NOT claim that the farmer is using too much fertilizer
or water unless the supplied data actually supports such
a conclusion.

### Farming Type Overview

Explain the distribution of Organic and Non-Organic
products recorded in FarmDirect.

Do not make unsupported environmental claims.

### Sustainability Considerations

Identify areas the farmer could review to improve
resource efficiency.

Examples may include reviewing irrigation scheduling,
fertilizer planning, input quantities, waste handling,
or record keeping, but recommendations must be connected
to the supplied data.

### Practical Recommendations

Provide 3 to 5 practical recommendations.

Focus on actions such as:

- reviewing irrigation planning
- reviewing fertilizer expenses and application plans
- tracking resource usage
- recording farm waste
- comparing sustainability indicators across future
  budget plans
- maintaining accurate Organic/Non-Organic records

Do not invent missing measurements.

### Missing Data

Clearly identify important sustainability metrics that
FarmDirect currently does not collect.

For example:

- Water consumption
- Electricity consumption
- Fuel consumption
- Fertilizer quantity
- Pesticide usage
- Crop waste
- Compost usage
- Carbon emissions

Explain that these metrics would be required for more
detailed sustainability measurement.

### Important Note

This analysis is based only on information currently recorded in FarmDirect and does not represent a certified environmental assessment or carbon footprint calculation.
`;

      // ---------------------------------------------------
      // Generate Gemini response
      // ---------------------------------------------------

      const insights =
        await generateAIResponse(
          prompt,
          {
            maxOutputTokens: 1500,

            systemInstruction:
              `
You are a factual agricultural sustainability
analytics assistant.

Use only the supplied FarmDirect database data.

Never invent environmental measurements,
carbon emissions, water consumption,
electricity consumption, fuel consumption,
fertilizer quantities, pesticide quantities,
or environmental impact values.

Do not turn financial costs into environmental
measurements automatically.

Clearly distinguish calculated values from
AI interpretation.

Be practical, concise, transparent, and
careful about uncertainty.

Use Indian Rupees (₹) when displaying
monetary values.
              `.trim(),
          }
        );

      // ---------------------------------------------------
      // Response
      // ---------------------------------------------------

      return res.json({
        message:
          'AI sustainability advice generated successfully.',

        data: sustainabilityData,

        insights,
      });
    } catch (error) {
      console.error(
        'AI sustainability advisor error:',
        error
      );

      return res.status(500).json({
        message:
          'Failed to generate AI sustainability advice.',

        error:
          error.message ||
          'Unknown error',
      });
    }
  }
);
// =====================================================
// AI FARM ASSISTANT
// =====================================================

router.post(
  '/farm-assistant',
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== 'farmer') {
        return res.status(403).json({
          message:
            'Only farmers can use the AI Farm Assistant.',
        });
      }

      const {
        question,
      } = req.body;

      if (
        !question ||
        typeof question !== 'string' ||
        !question.trim()
      ) {
        return res.status(400).json({
          message:
            'Please provide a valid question.',
        });
      }

      if (question.length > 1000) {
        return res.status(400).json({
          message:
            'Question is too long. Please keep it under 1000 characters.',
        });
      }

      const farmData =
        await buildFarmAssistantContext(
          req.user.id
        );

      const prompt = `
You are the AI Farm Assistant for FarmDirect.

Answer the farmer's question using ONLY the FarmDirect
farm data supplied below.

Do not invent:
- products
- sales
- revenue
- prices
- stock
- expenses
- yields
- market prices
- weather information
- agricultural statistics
- government schemes
- external facts

If the supplied data does not contain enough information
to answer a question, clearly say that the required data
is not available in FarmDirect.

IMPORTANT:
- Use ₹ for monetary values.
- Quantities are in kilograms where applicable.
- Be practical and easy for a farmer to understand.
- Do not guarantee profits or agricultural outcomes.
- Do not make unsupported claims.
- Do not pretend to know information outside the database.

FARM DATA:

${JSON.stringify(
  farmData,
  null,
  2
)}

FARMER QUESTION:

${question.trim()}

Respond with:

### Answer

Give a direct answer to the farmer's question.

### Relevant Farm Data

Mention the FarmDirect data that supports the answer.

### Practical Suggestions

Give practical suggestions based only on
the available FarmDirect data.

### Data Limitations

Mention any important information that is
missing from FarmDirect and would be needed
for a more complete answer.
`;

      const insights =
        await generateAIResponse(
          prompt,
          {
            maxOutputTokens: 1500,

            systemInstruction:
              'You are a factual FarmDirect AI assistant. Use only the supplied database context. Never invent farm-specific information. Use ₹ for Indian currency. Clearly identify missing information.',
          }
        );

      return res.json({
        message:
          'AI farm assistant response generated successfully.',

        question:
          question.trim(),

        data: farmData,

        insights,
      });
    } catch (error) {
      console.error(
        'AI Farm Assistant error:',
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          'Failed to generate AI farm assistant response.',
      });
    }
  }
);

// =====================================================
// AI SEASONAL PLANNING
// =====================================================

router.get(
  '/seasonal-planning',
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== 'farmer') {
        return res.status(403).json({
          message:
            'Only farmers can use AI Seasonal Planning.',
        });
      }

      const seasonalData =
        await buildSeasonalPlanningAnalysis(
          req.user.id
        );

      const hasFarmData =
        seasonalData.farmSummary
          .totalProducts > 0 ||
        seasonalData.farmSummary
          .totalUnitsSold > 0 ||
        seasonalData.latestBudget !== null;

      if (!hasFarmData) {
        return res.json({
          message:
            'Not enough farm data available for seasonal planning.',
          data: seasonalData,
          insights: null,
        });
      }

      const prompt = `
You are the AI Seasonal Planning Advisor for FarmDirect.

Your task is to help the farmer plan future farming activities
using ONLY the FarmDirect data supplied below.

IMPORTANT DATA RULES:

- Do not invent crop seasons.
- Do not invent weather conditions.
- Do not invent rainfall information.
- Do not invent soil conditions.
- Do not invent market prices.
- Do not invent demand forecasts.
- Do not invent government schemes.
- Do not invent agricultural statistics.
- Do not claim that a particular crop is suitable for a season
  unless that information is actually present in the supplied data.
- These are projections based on the saved FarmDirect budget and are not guarantees of future yield, revenue, or profit.
- Do not make unsupported agricultural claims.

FarmDirect currently provides:
- Product information
- Product categories
- Organic/Non-Organic classification
- Current stock
- Current prices
- Historical sales recorded in FarmDirect
- Revenue recorded in FarmDirect
- Saved budget information

Use these records to identify planning considerations.

IMPORTANT:
- Use ₹ for monetary values.
- Quantities are in kilograms.
- Clearly distinguish current FarmDirect data from AI recommendations.
- If seasonal/weather/crop-calendar information is missing,
  explicitly state that limitation.
- Do not present assumptions as facts.

FARMDIRECT FARM DATA:

${JSON.stringify(
  seasonalData,
  null,
  2
)}

Provide the response using these sections:

### Seasonal Planning Overview

Summarize the farmer's current FarmDirect data
that is relevant to future planning.

### Products With Strong Recorded Sales

Identify products that have the strongest recorded
sales based on the supplied FarmDirect data.

Explain that historical sales do not guarantee
future demand.

### Products Requiring Attention

Identify products with zero recorded sales,
high remaining stock, or other relevant database
indicators.

### Category Planning

Summarize the available product categories and
their recorded stock and sales.

### Budget Considerations

If budget information exists, summarize the latest
budget's costs, expected yield, expected revenue,
and expected profit using ₹.

Do not guarantee the projected results.

### Practical Planning Suggestions

Provide practical suggestions based only on the
available FarmDirect information.

### Missing Seasonal Information

Clearly state which important seasonal planning
data is not available, such as weather,
rainfall, local crop calendars, soil information,
or external market forecasts.

### Important Note

This planning guidance is based only on information
currently recorded in FarmDirect. Historical sales
and budget projections do not guarantee future
demand, yield, revenue, or profit.
`;

      const insights =
        await generateAIResponse(
          prompt,
          {
            maxOutputTokens: 1600,

            systemInstruction:
              'You are a factual FarmDirect seasonal planning assistant. Use only supplied FarmDirect data. Never invent weather, crop seasons, market forecasts, or agricultural statistics. Use ₹ for monetary values and clearly identify missing seasonal information.',
          }
        );

      return res.json({
        message:
          'AI seasonal planning generated successfully.',

        data: seasonalData,

        insights,
      });
    } catch (error) {
      console.error(
        'AI Seasonal Planning error:',
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          'Failed to generate AI seasonal planning.',
      });
    }
  }
);
module.exports = router;