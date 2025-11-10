// FIX: Removed 'vite/client' reference which caused a "Cannot find type definition file" error.
// The manual 'process' declaration below is sufficient for this file's needs.

// Add declarations to resolve TypeScript errors in an environment without Node types
// or standard NPM module resolution for @google/genai (due to importmap).
declare var process: {
  env: {
    [key: string]: string | undefined;
  };
};

// FIX: Removed manual 'declare module "@google/genai"' block to resolve identifier conflict errors.
// The import statement below now correctly provides the necessary types.
import { GoogleGenAI, Type } from "@google/genai";
import type { ReceiptData, PosMenuItem } from '../types';

const processReceiptImage = async (
  base64Image: string, 
  mimeType: string,
  posMenu: PosMenuItem[] // Accept the POS menu as context
): Promise<Omit<ReceiptData, 'items'> & { items: { name: string; quantity: number; price: number }[] }> => {
  // Fix: The API key must be obtained exclusively from process.env.API_KEY.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });


  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  // Create a context string from the POS menu, including options
  const menuContext = posMenu.map(item => {
    const optionNames = item.options ? item.options.map(opt => opt.name).join(', ') : '';
    return `${item.name}${optionNames ? ` (ตัวเลือก: ${optionNames})` : ''}`;
  }).join('; ');

  const textPart = {
    text: `
      You are an expert receipt processing AI specializing in LINE MAN food delivery receipts, which are primarily in Thai.
      Analyze the provided image of a LINE MAN receipt.
      Your primary task is to extract all information in Thai.

      Here is the list of available menu items and their options to help you: [${menuContext}]

      - Extract the order ID. It's often labeled "Order ID", "หมายเลขอ้างอิง", or "เลขที่ออเดอร์" and may start with a '#'. If you find it, extract it.
      - Extract the list of items. For each item, provide its name, quantity, and price.
      - **QUANTITY**: The quantity is the number at the beginning of the item line, often followed by an 'x' (e.g., "1x", "2x"). Extract this number for the quantity field. If no number is present for an item, assume the quantity is 1.
      - **CRITICAL**: The 'name' for each item MUST be in Thai. The name should NOT include the quantity prefix (e.g., "1x").
      - **VERY IMPORTANT**: The extracted item name should include the main dish and any selected options, for example, "ซุปกิมจิ เผ็ดปกติ". Try your best to match the extracted item name to a combination of a main item and an option from the provided menu list.
      - Extract the subtotal, delivery fee, any discounts, and the final total amount.
      - All monetary values should be returned as numbers (float or integer), not strings.
      - Structure the output as a JSON object that strictly adheres to the provided schema. Do not add any extra explanations or text outside of the JSON structure.
    `,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                orderId: {
                    type: Type.STRING,
                    description: 'The order ID, e.g., "#LM123456"',
                    nullable: true,
                },
                items: {
                    type: Type.ARRAY,
                    description: 'List of items ordered.',
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: {
                                type: Type.STRING,
                                description: 'The full name of the item in Thai, including any options (e.g., "ซุปกิมจิ เผ็ดปกติ"). Do not include the quantity prefix like "1x".'
                            },
                            quantity: {
                                type: Type.INTEGER,
                                description: 'The quantity of the item.'
                            },
                            price: {
                                type: Type.NUMBER,
                                description: 'The total price for this line item (unit price * quantity).'
                            },
                        },
                        required: ['name', 'quantity', 'price'],
                    },
                },
                subtotal: {
                    type: Type.NUMBER,
                    description: 'The subtotal before any fees or discounts.',
                    nullable: true,
                },
                deliveryFee: {
                    type: Type.NUMBER,
                    description: 'The delivery fee.',
                    nullable: true,
                },
                discount: {
                    type: Type.NUMBER,
                    description: 'The total discount amount. If there are multiple discounts, sum them up.',
                    nullable: true,
                },
                total: {
                    type: Type.NUMBER,
                    description: 'The final total amount paid.'
                }
            },
            required: ['items', 'total'],
        },
    }
  });

  const jsonText = response.text.trim();
  try {
    const parsedData = JSON.parse(jsonText);
    return parsedData as Omit<ReceiptData, 'items'> & { items: { name: string; quantity: number; price: number }[] };
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", jsonText);
    throw new Error("The data received from the AI was not in the expected format.");
  }
};

export { processReceiptImage };