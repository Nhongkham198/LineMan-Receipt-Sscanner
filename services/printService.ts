import type { ReceiptData } from '../types';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'ไม่สามารถเชื่อมต่อกับโปรแกรมตัวกลาง (Bridge) ได้ กรุณาตรวจสอบว่าโปรแกรมทำงานอยู่บนเครื่องของคุณ';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
};

// Private helper to send a print job to the local bridge application
const sendToLocalBridge = async (payload: object): Promise<{ success: boolean; message: string }> => {
  const bridgeUrl = 'http://localhost:4000/print'; // Standard endpoint for the local bridge

  console.log(`Sending print job to local bridge: ${bridgeUrl}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      mode: 'cors', // We expect the local bridge to handle CORS correctly
    });

    const responseBody = await response.json().catch(() => ({ message: 'Invalid response from bridge' }));

    if (!response.ok) {
        throw new Error(responseBody.message || `Bridge returned an error: ${response.statusText}`);
    }
    
    return { success: true, message: responseBody.message || 'ส่งคำสั่งพิมพ์ไปที่โปรแกรมตัวกลางสำเร็จ' };
  } catch (error) {
    console.error('Error sending data to local bridge:', error);
    return { success: false, message: getErrorMessage(error) };
  }
};


/**
 * Generates a formatted plain text list of scanned items.
 * @param data The receipt data.
 * @param paperWidth The width of the paper in mm (58 or 80).
 * @param printSourceName Determines which item name to use for printing.
 * @returns A formatted string ready for printing.
 */
export const generateScannedItemsText = (data: ReceiptData, paperWidth: '58' | '80', printSourceName: 'original' | 'pos'): string => {
  const width = paperWidth === '58' ? 32 : 42;

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  let output = '';
  output += center('** รายการออเดอร์ **') + '\n';
  if (data.orderId) {
    const formattedOrderId = `#${String(data.orderId).replace(/#/g, '')}`;
    output += center(formattedOrderId) + '\n';
  }
  output += center(new Date().toLocaleString('th-TH')) + '\n';
  output += '-'.repeat(width) + '\n';
  
  data.items.forEach((item, index) => {
    if (index > 0) {
      output += '\n'; // Add space between items
    }

    let itemName: string;
    if (printSourceName === 'pos' && item.selectedPosItem) {
        itemName = `${item.selectedPosItem.name}${item.selectedOption ? ` ${item.selectedOption.name}` : ''}`;
    } else {
        // Fallback to original name if 'pos' is selected but item isn't mapped,
        // or if 'original' is selected.
        itemName = item.originalName;
    }


    const quantityStr = `(${item.quantity}x)`;

    // Word wrap the item name to fit the paper width.
    const words = itemName.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if (currentLine.length === 0) {
            currentLine = word;
        } else if (currentLine.length + 1 + word.length <= width) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine.length > 0) {
        lines.push(currentLine);
    }
    
    if (lines.length === 0) {
        lines.push('');
    }

    // Format the lines for printing.
    lines.forEach((line, idx) => {
      if (idx === lines.length - 1) { // On the last line, add the quantity.
        if (line.length + 1 + quantityStr.length <= width) {
          // If it fits, print item name on the left and quantity on the right.
          const padding = width - line.length - quantityStr.length;
          output += line + ' '.repeat(padding) + quantityStr + '\n';
        } else {
          // If not, print the name on its own line, and quantity on the next.
          output += line + '\n';
          output += ' '.repeat(width - quantityStr.length) + quantityStr + '\n';
        }
      } else {
        // For lines before the last, just print the line.
        output += line + '\n';
      }
    });
  });

  output += '-'.repeat(width) + '\n\n\n\n';
  
  return output;
};


/**
 * Sends a pre-generated text string to a thermal printer via the local bridge.
 * @param textToPrint The pre-formatted string to be printed.
 * @param ipAddress The IP address of the thermal printer.
 * @param port The port of the thermal printer.
 */
export const printScannedItemsList = async (
  textToPrint: string,
  ipAddress: string,
  port: string
): Promise<{ success: boolean; message: string }> => {
  const payload = {
    ip: ipAddress,
    port: port,
    text: textToPrint
  };
  return sendToLocalBridge(payload);
};

/**
 * Sends a test print job to the specified printer via the local bridge to verify the connection.
 * @param ipAddress The IP address of the thermal printer.
 * @param port The port of the thermal printer.
 * @param paperSize The width of the paper for formatting.
 */
export const testPrinterConnection = async (
  ipAddress: string,
  port: string,
  paperSize: '58' | '80'
): Promise<{ success: boolean; message: string }> => {
  const width = paperSize === '58' ? 32 : 42;
  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  let testText = '';
  testText += center('Test Print') + '\n';
  testText += center('ทดสอบการพิมพ์') + '\n';
  testText += '-'.repeat(width) + '\n';
  testText += `Connection successful!\n`;
  testText += `เชื่อมต่อสำเร็จ!\n`;
  testText += `IP: ${ipAddress}\n`;
  testText += `Port: ${port}\n`;
  testText += `Time: ${new Date().toLocaleTimeString('th-TH')}\n`;
  testText += '-'.repeat(width) + '\n\n\n\n';

  const payload = {
    ip: ipAddress,
    port: port,
    text: testText
  };
  return sendToLocalBridge(payload);
};
