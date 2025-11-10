import type { MappedLineItem, PosMenuItem } from '../types';
import { testPrinterConnection } from './printService';


const correctUrl = (url: string): string => {
  if (!url || url.trim() === '') {
    return '';
  }
  // Robustly strip any existing, potentially incorrect protocol and ensure it starts with https://
  const cleanedUrl = url.trim().replace(/^(?:[a-zA-Z]+:\/\/)?(.*)/, '$1');
  return `https://${cleanedUrl}`;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ POS ได้ อาจเกิดจากปัญหาการตั้งค่า CORS บนเซิร์ฟเวอร์ของคุณ หรือ URL ที่ระบุไม่ถูกต้อง';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
}

/**
 * Fetches the menu from the user's POS system.
 * @param menuEndpointUrl The API endpoint to fetch the menu from.
 */
export const fetchMenu = async (menuEndpointUrl: string): Promise<PosMenuItem[]> => {
  if (!menuEndpointUrl) {
    throw new Error('กรุณาระบุ URL ของ Menu API');
  }
  
  const correctedUrl = correctUrl(menuEndpointUrl);

  try {
    const response = await fetch(correctedUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`ไม่สามารถดึงเมนูได้: ${response.statusText} (Status: ${response.status})`);
    }
    const menuData: PosMenuItem[] = await response.json();
    if (!Array.isArray(menuData) || menuData.some(item => !item.id || !item.name || item.price === undefined)) {
        throw new Error('รูปแบบข้อมูลเมนูไม่ถูกต้อง');
    }
    return menuData;
  } catch (error) {
    console.error('Error fetching POS menu:', error);
    throw new Error(getErrorMessage(error));
  }
};


/**
 * Sends the mapped order data to the POS system.
 * @param items The mapped line items with selected POS items.
 * @param endpointUrl The POS API endpoint URL to send the data to.
 */
export const sendToPOS = async (items: MappedLineItem[], endpointUrl: string): Promise<{ success: boolean; message: string }> => {
  const orderPayload = {
    items: items
      .filter(item => item.selectedPosItem)
      .map(item => ({
        id: item.selectedPosItem!.id,
        name: item.selectedPosItem!.name,
        price: item.finalPrice ?? item.selectedPosItem!.price,
        quantity: item.quantity,
      })),
  };
  
  if (!endpointUrl || endpointUrl.trim() === '') {
     const errorMessage = 'กรุณาระบุ URL ของ Order API';
     console.error(errorMessage);
     return { success: false, message: errorMessage };
  }
  
  const correctedUrl = correctUrl(endpointUrl);

  console.log('Sending mapped order to POS:', JSON.stringify(orderPayload, null, 2));
  console.log(`Target endpoint: ${correctedUrl}`);

  try {
    const response = await fetch(correctedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    // --- UPGRADE: Handle detailed response from backend ---
    // Try to parse the response body to get a more detailed message.
    const responseBody = await response.json().catch(() => response.text());

    if (!response.ok) {
      const errorMessage = typeof responseBody === 'object' && responseBody.message ? responseBody.message : responseBody;
      console.error(`Failed to send to POS. Status: ${response.status}. Body:`, responseBody);
      throw new Error(`ส่งข้อมูลไม่สำเร็จ: ${errorMessage || response.statusText}`);
    }
    
    // If the backend sends a specific message, use it. Otherwise, use a default.
    const successMessage = typeof responseBody === 'object' && responseBody.message ? responseBody.message : 'ส่งข้อมูลสำเร็จ!';

    await new Promise(resolve => setTimeout(resolve, 1000));

    return { success: true, message: successMessage };

  } catch (error) {
    console.error('Error sending data to POS:', error);
    return { success: false, message: getErrorMessage(error) };
  }
};

export { testPrinterConnection };