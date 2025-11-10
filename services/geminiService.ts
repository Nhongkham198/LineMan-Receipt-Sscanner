import { GoogleGenAI, Type } from "@google/genai";
import type { ReceiptData, PosMenuItem } from '../types';

const processReceiptImage = async (
  base64Image: string, 
  mimeType: string,
  posMenu: PosMenuItem[] // Accept the POS menu as context
): Promise<Omit<ReceiptData, 'items'> & { items: { name: string; quantity: number; price: number }[] }> => {
  // FIX: Use `process.env.API_KEY` as per guidelines, which also resolves the `import.meta.env` TypeScript error.
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is not configured in the environment.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      - Extract the subtotal, delivery fee, any discounts, and the grand total.
      - Provide the output in a structured JSON format according to the provided schema.
      - If a value for a nullable field (subtotal, deliveryFee, discount, orderId) is not present on the receipt, use null for that field. The total is mandatory.
      - Ensure all numerical values are numbers, not strings.
    `,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [textPart, imagePart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          orderId: { type: Type.STRING, description: "The order ID or reference number, if present on the receipt.", nullable: true },
          items: {
            type: Type.ARRAY,
            description: "List of all items ordered.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the item, in Thai, including any options (e.g., 'ซุปกิมจิ เผ็ดปกติ'), matched from the provided menu list." },
                quantity: { type: Type.INTEGER, description: "Quantity of the item." },
                price: { type: Type.NUMBER, description: "Price of a single item." },
              },
              required: ["name", "quantity", "price"],
            },
          },
          subtotal: { type: Type.NUMBER, description: "The subtotal before fees and discounts.", nullable: true },
          deliveryFee: { type: Type.NUMBER, description: "The delivery fee.", nullable: true },
          discount: { type: Type.NUMBER, description: "Total discount applied.", nullable: true },
          total: { type: Type.NUMBER, description: "The final grand total." },
        },
        required: ["items", "total"],
      },
    },
  });

  try {
    const jsonString = response.text;
    const parsedData = JSON.parse(jsonString);
    return parsedData;
  } catch (error) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("Invalid data format received from API.");
  }
};

export { processReceiptImage };