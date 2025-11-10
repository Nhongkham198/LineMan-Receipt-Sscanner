import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ImageUploader } from './components/ImageUploader';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Spinner } from './components/Spinner';
import { processReceiptImage } from './services/geminiService';
import { fetchMenu, testPrinterConnection } from './services/posService';
import { posMenuData } from './services/mockMenuData'; // Import the new built-in menu
import { findBestMatch } from './lib/stringSimilarity'; // Import the fuzzy matching utility
import type { ReceiptData, PosMenuItem, MappedLineItem } from './types';
import { DownloadIcon } from './components/icons/DownloadIcon';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [posApiEndpoint, setPosApiEndpoint] = useState<string>('');
  const [posMenuEndpoint, setPosMenuEndpoint] = useState<string>('');
  const [printerIp, setPrinterIp] = useState<string>('');
  const [printerPort, setPrinterPort] = useState<string>('9100');
  const [printerPaperSize, setPrinterPaperSize] = useState<'58' | '80'>('80');
  
  const [useBuiltInMenu, setUseBuiltInMenu] = useState<boolean>(true);
  
  const [tempPosApiEndpoint, setTempPosApiEndpoint] = useState<string>('');
  const [tempPosMenuEndpoint, setTempPosMenuEndpoint] = useState<string>('');
  const [tempPrinterIp, setTempPrinterIp] = useState<string>('');
  const [tempPrinterPort, setTempPrinterPort] = useState<string>('9100');
  const [tempPrinterPaperSize, setTempPrinterPaperSize] = useState<'58' | '80'>('80');

  const [posMenu, setPosMenu] = useState<PosMenuItem[]>([]);
  const [importedMenu, setImportedMenu] = useState<PosMenuItem[] | null>(null);
  const [pendingImportMenu, setPendingImportMenu] = useState<PosMenuItem[] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [menuStatus, setMenuStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [menuError, setMenuError] = useState<string | null>(null);

  const [printerTestStatus, setPrinterTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [printerTestMessage, setPrinterTestMessage] = useState<string>('');

  useEffect(() => {
    const savedEndpoint = localStorage.getItem('posApiEndpoint') || '';
    const savedMenuEndpoint = localStorage.getItem('posMenuEndpoint') || '';
    const savedPrinterIp = localStorage.getItem('printerIp') || '';
    const savedPrinterPort = localStorage.getItem('printerPort') || '9100';
    const savedPaperSize = localStorage.getItem('printerPaperSize') as '58' | '80' || '80';
    const savedImportedMenu = localStorage.getItem('importedMenu');
    
    setPosApiEndpoint(savedEndpoint);
    setTempPosApiEndpoint(savedEndpoint);
    
    setPosMenuEndpoint(savedMenuEndpoint);
    setTempPosMenuEndpoint(savedMenuEndpoint);

    setPrinterIp(savedPrinterIp);
    setTempPrinterIp(savedPrinterIp);
    
    setPrinterPort(savedPrinterPort);
    setTempPrinterPort(savedPrinterPort);

    setPrinterPaperSize(savedPaperSize);
    setTempPrinterPaperSize(savedPaperSize);

    if (savedImportedMenu) {
        try {
            const parsedMenu = JSON.parse(savedImportedMenu);
            setImportedMenu(parsedMenu);
        } catch (e) {
            console.error('Failed to parse imported menu from localStorage', e);
            localStorage.removeItem('importedMenu');
        }
    }

    if (!savedMenuEndpoint) {
      setUseBuiltInMenu(true);
    }

  }, []);
  
    // Reset printer test status if IP or Port changes
  useEffect(() => {
    setPrinterTestStatus('idle');
    setPrinterTestMessage('');
  }, [tempPrinterIp, tempPrinterPort]);

  const handleFetchMenu = useCallback(async (endpoint: string) => {
    if (!endpoint || endpoint.trim() === '') {
        setPosMenu([]);
        setMenuStatus('idle');
        return;
    }
    setMenuStatus('loading');
    setMenuError(null);
    try {
      const menu = await fetchMenu(endpoint);
      setPosMenu(menu);
      setMenuStatus('success');
    } catch (err) {
      setPosMenu([]);
      setMenuStatus('error');
      setMenuError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    }
  }, []);
  
  useEffect(() => {
    if (useBuiltInMenu) {
      setPosMenu(importedMenu || posMenuData);
      setMenuStatus('success');
      setMenuError(null);
    } else {
      handleFetchMenu(posMenuEndpoint);
    }
  }, [useBuiltInMenu, posMenuEndpoint, handleFetchMenu, importedMenu]);

  const handleSavePosSettings = () => {
    const trimmedMenuEndpoint = tempPosMenuEndpoint.trim();
    
    localStorage.setItem('posApiEndpoint', tempPosApiEndpoint);
    setPosApiEndpoint(tempPosApiEndpoint);
    
    localStorage.setItem('posMenuEndpoint', trimmedMenuEndpoint);
    setPosMenuEndpoint(trimmedMenuEndpoint);
    
    localStorage.setItem('printerIp', tempPrinterIp);
    setPrinterIp(tempPrinterIp);

    localStorage.setItem('printerPort', tempPrinterPort);
    setPrinterPort(tempPrinterPort);
    
    localStorage.setItem('printerPaperSize', tempPrinterPaperSize);
    setPrinterPaperSize(tempPrinterPaperSize);

    setUseBuiltInMenu(trimmedMenuEndpoint === '');
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleItemMap = (itemIndex: number, selectedPosItem: PosMenuItem | null) => {
    if (!extractedData) return;

    const updatedItems = [...extractedData.items];
    const currentItem = updatedItems[itemIndex];
    
    currentItem.selectedPosItem = selectedPosItem;
    currentItem.selectedOption = null; // When manually mapping, we can't determine the option, so clear it.
    // When user manually selects, we revert to base price and clear the specific option match.
    currentItem.finalPrice = selectedPosItem ? selectedPosItem.price : undefined;
    currentItem.matchConfidence = selectedPosItem ? 1.0 : undefined; // Manual selection is a perfect match

    setExtractedData({
        ...extractedData,
        items: updatedItems,
    });
  };

  const handleImageChange = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setExtractedData(null);
    setError(null);
  };

  const handleProcessReceipt = useCallback(async () => {
    if (!imageFile) {
      setError('กรุณาเลือกรูปภาพใบเสร็จก่อน');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); 
        };
        reader.onerror = (error) => reject(error);
      });

      const data = await processReceiptImage(base64Image, imageFile.type, posMenu);
      
      const mappedItems: MappedLineItem[] = data.items.map(item => {
          const bestMatchResult = findBestMatch(item.name, posMenu);
          return {
              originalName: item.name,
              quantity: item.quantity,
              originalPrice: item.price,
              selectedPosItem: bestMatchResult ? bestMatchResult.item : null,
              selectedOption: bestMatchResult?.matchedOption ?? null,
              finalPrice: bestMatchResult ? bestMatchResult.price : undefined,
              matchConfidence: bestMatchResult ? bestMatchResult.confidence : undefined,
          };
      });

      setExtractedData({ ...data, items: mappedItems });

    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการประมวลผลใบเสร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, posMenu]);

  const parseExcelToMenu = (data: ArrayBuffer): PosMenuItem[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
  
    if (rows.length < 2) {
      return [];
    }
  
    const headers = rows[0].map(h => (h ? String(h).trim().toLowerCase() : ''));
    
    const idIndex = headers.indexOf('id');
    const nameIndex = headers.indexOf('name');
    const priceIndex = headers.indexOf('price');
    const optionGroupNameIndex = headers.indexOf('option_group_name');
    const optionNameIndex = headers.indexOf('option_name');
    const optionPriceModifierIndex = headers.indexOf('option_price_modifier');
  
    if (idIndex === -1 || nameIndex === -1 || priceIndex === -1) {
      throw new Error('ไฟล์ Excel ต้องมีคอลัมน์ "id", "name", และ "price" กรุณาตรวจสอบไฟล์ของคุณ');
    }
  
    const menuItemsMap = new Map<string, PosMenuItem>();
  
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0) continue;
  
      const id = row[idIndex] !== null && row[idIndex] !== undefined ? String(row[idIndex]) : '';
      const name = row[nameIndex] !== null && row[nameIndex] !== undefined ? String(row[nameIndex]) : '';
      const price = parseFloat(String(row[priceIndex]));
  
      if (id && name && !isNaN(price)) {
        let item = menuItemsMap.get(id);
        if (!item) {
          item = { id, name, price, options: [] };
          menuItemsMap.set(id, item);
        }

        const groupName = optionGroupNameIndex > -1 && row[optionGroupNameIndex] ? String(row[optionGroupNameIndex]).trim() : '';
        const optionName = optionNameIndex > -1 && row[optionNameIndex] ? String(row[optionNameIndex]).trim() : '';
        if(groupName && optionName) {
            const priceModifierStr = optionPriceModifierIndex > -1 && row[optionPriceModifierIndex] !== null && row[optionPriceModifierIndex] !== undefined ? String(row[optionPriceModifierIndex]) : '0';
            const priceModifier = parseFloat(priceModifierStr);

            item.options.push({
                groupName,
                name: optionName,
                priceModifier: !isNaN(priceModifier) ? priceModifier : 0,
            });
        }
      }
    }
    
    const finalMenu = Array.from(menuItemsMap.values());
    // This part is for counting unique items for display, not related to options.
    const uniqueItemIds = new Set(finalMenu.map(item => item.id));
    return finalMenu.filter(item => {
        if(uniqueItemIds.has(item.id)) {
            uniqueItemIds.delete(item.id);
            return true;
        }
        return false;
    });
  };

  const handleMenuFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const fileInput = event.target;
    
    setPendingImportMenu(null);
    setSelectedFileName('');

    if (!file) {
      if (fileInput) fileInput.value = '';
      return;
    }
    
    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) throw new Error('ไม่สามารถอ่านไฟล์ได้');
                
                const parsedMenu = parseExcelToMenu(data as ArrayBuffer);

                if (parsedMenu.length > 0) {
                    const uniqueIds = new Set(parsedMenu.map(item => item.id));
                    if (uniqueIds.size > 0) {
                        setPendingImportMenu(parsedMenu);
                        setSelectedFileName(file.name);
                    } else {
                         throw new Error('ไม่พบรายการอาหารที่ไม่ซ้ำกันในไฟล์');
                    }
                } else {
                    throw new Error('ไม่พบข้อมูลเมนูที่ถูกต้องในไฟล์ (ตรวจสอบว่ามีคอลัมน์ id, name, price และมีข้อมูลอย่างน้อย 1 แถว)');
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลไฟล์';
                console.error(err);
                alert(`เกิดข้อผิดพลาด: ${message}`);
            } finally {
                if (fileInput) {
                  fileInput.value = '';
                }
            }
        };
        reader.onerror = () => {
            alert('ไม่สามารถอ่านไฟล์ได้');
            if (fileInput) {
              fileInput.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
        alert(`เกิดข้อผิดพลาด: ${message}`);
        if (fileInput) {
          fileInput.value = '';
        }
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImportMenu || !selectedFileName) return;

    localStorage.setItem('importedMenu', JSON.stringify(pendingImportMenu));
    setImportedMenu(pendingImportMenu);
    setPosMenu(pendingImportMenu);
    setUseBuiltInMenu(true);
    
    const uniqueItemCount = new Set(pendingImportMenu.map(item => item.id)).size;
    
    setPendingImportMenu(null);
    
    alert(`นำเข้าเมนู "${selectedFileName}" สำเร็จ (${uniqueItemCount} รายการ)`);
  };
  
  const handleClearImportedMenu = () => {
    if (window.confirm('คุณต้องการลบเมนูที่นำเข้าและกลับไปใช้เมนูตั้งต้นหรือไม่?')) {
        localStorage.removeItem('importedMenu');
        setImportedMenu(null);
        setPosMenu(posMenuData);
        setSelectedFileName('');
        setPendingImportMenu(null);
        alert('ลบเมนูที่นำเข้าแล้ว');
    }
  };

  const handleDownloadTemplate = () => {
    // Note: This template includes a comprehensive list of headers for compatibility,
    // even though our parser only requires a subset (id, name, price, and option fields).
    const headers = [
        'id', 'name', 'price', 'category', 'image_url', 'cooking_time', 
        'option_group_name', 'option_group_type', 'option_group_required', 
        'option_name', 'option_price_modifier', 'option_is_default'
    ];
    const sampleData = [
        { 'id': 'SKU-001', 'name': 'ซุปกิมจิ', 'price': 119, 'category': 'เมนู ซุป', 'image_url': '', 'cooking_time': 15, 'option_group_name': 'เนื้อ', 'option_group_type': 'single', 'option_group_required': 'TRUE', 'option_name': 'หมู', 'option_price_modifier': 0, 'option_is_default': 'TRUE' },
        { 'id': 'SKU-001', 'name': 'ซุปกิมจิ', 'price': 119, 'category': 'เมนู ซุป', 'image_url': '', 'cooking_time': 15, 'option_group_name': 'เนื้อ', 'option_group_type': 'single', 'option_group_required': 'TRUE', 'option_name': 'ปลา', 'option_price_modifier': 0, 'option_is_default': 'FALSE' },
        { 'id': 'SKU-001', 'name': 'ซุปกิมจิ', 'price': 119, 'category': 'เมนู ซุป', 'image_url': '', 'cooking_time': 15, 'option_group_name': 'รสเผ็ด', 'option_group_type': 'single', 'option_group_required': 'TRUE', 'option_name': 'เผ็ดน้อย', 'option_price_modifier': 0, 'option_is_default': 'FALSE' },
        { 'id': 'SKU-001', 'name': 'ซุปกิมจิ', 'price': 119, 'category': 'เมนู ซุป', 'image_url': '', 'cooking_time': 15, 'option_group_name': 'รสเผ็ด', 'option_group_type': 'single', 'option_group_required': 'TRUE', 'option_name': 'เผ็ดปกติ', 'option_price_modifier': 0, 'option_is_default': 'TRUE' },
        { 'id': 'SKU-002', 'name': 'ข้าวผัดกิมจิ', 'price': 99, 'category': 'เมนู ข้าว', 'image_url': '', 'cooking_time': 15, 'option_group_name': 'ไข่ดาว', 'option_group_type': 'single', 'option_group_required': 'FALSE', 'option_name': 'ไข่ดาว สุก', 'option_price_modifier': 10, 'option_is_default': 'FALSE' },
        { 'id': 'SKU-002', 'name': 'ข้าวผัดกิมจิ', 'price': 99, 'category': 'เมนู ข้าว', 'image_url': '', 'cooking_time': 15, 'option_group_name': 'ไข่ดาว', 'option_group_type': 'single', 'option_group_required': 'FALSE', 'option_name': 'ไข่ดาว ไม่สุก', 'option_price_modifier': 10, 'option_is_default': 'FALSE' },
        { 'id': 'SKU-003', 'name': 'ชานมไข่มุก', 'price': 50, 'category': 'เครื่องดื่ม', 'image_url': '', 'cooking_time': 5, 'option_group_name': '', 'option_group_type': '', 'option_group_required': '', 'option_name': '', 'option_price_modifier': '', 'option_is_default': '' }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MenuData");
    XLSX.writeFile(wb, "pos_menu_template.xlsx");
};
  
    const handleTestPrinter = async () => {
        if (!tempPrinterIp || !tempPrinterPort) return;
        setPrinterTestStatus('testing');
        setPrinterTestMessage('');
        
        // Wait 1s to simulate network latency and give user feedback
        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await testPrinterConnection(tempPrinterIp, tempPrinterPort, tempPrinterPaperSize);
        if (result.success) {
            setPrinterTestStatus('success');
            setPrinterTestMessage('เชื่อมต่อสำเร็จ! คำสั่งพิมพ์ทดสอบถูกส่งแล้ว');
        } else {
            setPrinterTestStatus('error');
            setPrinterTestMessage(`เชื่อมต่อล้มเหลว: ${result.message}`);
        }
    };
  
  const MenuStatusDisplay = () => {
    if (useBuiltInMenu) {
        if (importedMenu) {
            const uniqueItemCount = new Set(importedMenu.map(item => item.id)).size;
            return <span className="text-green-700">✔️ ใช้เมนูจากไฟล์ที่นำเข้า ({uniqueItemCount} รายการ)</span>;
        }
        const uniqueItemCount = new Set(posMenuData.map(item => item.id)).size;
        return <span className="text-gray-500">ใช้เมนูที่ติดตั้งในโปรแกรม ({uniqueItemCount} รายการ)</span>;
    }

    if (!posMenuEndpoint) return <span className="text-gray-500">กรุณาระบุ Menu API Endpoint</span>;

    switch (menuStatus) {
        case 'loading':
            return <span className="text-gray-500">กำลังโหลดเมนูจาก API...</span>;
        case 'success':
            return <span className="text-green-700">✔️ โหลดเมนูจาก API สำเร็จ (${new Set(posMenu.map(i => i.id)).size} รายการ)</span>;
        case 'error':
            return <span className="text-red-600">❌ {menuError}</span>;
        default:
            return null;
    }
  };
  
  const pendingImportCount = pendingImportMenu ? new Set(pendingImportMenu.map(item => item.id)).size : 0;
  
  const getPrinterStatusColor = () => {
    switch(printerTestStatus) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-blue-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <main className="container mx-auto max-w-4xl p-4 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-green-600">LINE MAN Receipt Scanner</h1>
          <p className="text-lg text-gray-600 mt-2">
            อัปโหลดภาพใบเสร็จเพื่อจับคู่เมนูและส่งข้อมูลเข้าระบบ POS
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">⚙️ การตั้งค่าระบบ POS และเครื่องพิมพ์</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="pos-endpoint" className="block text-sm font-medium text-gray-600 mb-1">
                Order API Endpoint URL
              </label>
              <input
                id="pos-endpoint"
                type="url"
                value={tempPosApiEndpoint}
                onChange={(e) => setTempPosApiEndpoint(e.target.value)}
                placeholder="https://your-pos.com/api/orders"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-800 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label htmlFor="pos-menu-endpoint" className="block text-sm font-medium text-gray-600 mb-1">
                Menu API Endpoint URL (ถ้ามี)
              </label>
              <input
                id="pos-menu-endpoint"
                type="url"
                value={tempPosMenuEndpoint}
                onChange={(e) => setTempPosMenuEndpoint(e.target.value)}
                placeholder="https://your-pos.com/api/menu"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-800 placeholder:text-gray-400"
              />
            </div>
             <div>
               <label htmlFor="printer-ip" className="block text-sm font-medium text-gray-600 mb-1">
                Printer IP Address
              </label>
              <input
                id="printer-ip"
                type="text"
                value={tempPrinterIp}
                onChange={(e) => setTempPrinterIp(e.target.value)}
                placeholder="192.168.1.235"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-800 placeholder:text-gray-400"
              />
            </div>
            <div>
               <label htmlFor="printer-port" className="block text-sm font-medium text-gray-600 mb-1">
                Port
              </label>
              <input
                id="printer-port"
                type="number"
                value={tempPrinterPort}
                onChange={(e) => setTempPrinterPort(e.target.value)}
                placeholder="9100"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-800 placeholder:text-gray-400"
              />
            </div>
            <div className="md:col-span-2">
                <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                    <button
                        onClick={handleTestPrinter}
                        disabled={!tempPrinterIp || !tempPrinterPort || printerTestStatus === 'testing'}
                        className="px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                        {printerTestStatus === 'testing' && <Spinner />}
                        {printerTestStatus === 'testing' ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
                    </button>
                    <div className={`text-sm font-medium ${getPrinterStatusColor()}`}>
                        {printerTestStatus === 'idle' && 'สถานะ: ยังไม่ได้ทดสอบ'}
                        {printerTestStatus === 'success' && `✔️ ${printerTestMessage}`}
                        {printerTestStatus === 'error' && `❌ ${printerTestMessage}`}
                    </div>
                </div>
            </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                    ขนาดกระดาษเครื่องพิมพ์
                </label>
                <div className="flex items-center space-x-6">
                    <label htmlFor="paper-58" className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            id="paper-58"
                            name="paperSize"
                            value="58"
                            checked={tempPrinterPaperSize === '58'}
                            onChange={() => setTempPrinterPaperSize('58')}
                            className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">58mm</span>
                    </label>
                    <label htmlFor="paper-80" className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            id="paper-80"
                            name="paperSize"
                            value="80"
                            checked={tempPrinterPaperSize === '80'}
                            onChange={() => setTempPrinterPaperSize('80')}
                            className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">80mm</span>
                    </label>
                </div>
            </div>
          </div>
          <div className="mt-4 flex items-center">
             <input 
                type="checkbox"
                id="mock-menu-checkbox"
                checked={useBuiltInMenu}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setUseBuiltInMenu(isChecked);
                  if (isChecked) {
                    setTempPosMenuEndpoint('');
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
             />
             <label htmlFor="mock-menu-checkbox" className="ml-2 block text-sm text-gray-900">
                ใช้เมนูที่ติดตั้งในโปรแกรม (แนะนำ)
            </label>
          </div>

           <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                    หรือนำเข้าเมนูจากไฟล์ Excel
                </label>
                <p className="text-xs text-gray-500">
                    ไฟล์ที่นำเข้าจะถูกใช้แทนเมนูที่ติดตั้งในโปรแกรม (เมื่อติ๊กช่องด้านบน)
                </p>
              </div>
              <button 
                  onClick={handleDownloadTemplate} 
                  className="flex-shrink-0 flex items-center gap-2 text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-semibold py-1.5 px-3 rounded-md transition-colors"
                  title="ดาวน์โหลดไฟล์ตัวอย่าง (.xlsx)"
              >
                  <DownloadIcon className="w-4 h-4" />
                  <span>ดาวน์โหลดเทมเพลต</span>
              </button>
            </div>
             <div className="text-xs text-gray-600 mb-3 bg-gray-200 p-2 rounded-md">
                <p><b>คอลัมน์ที่ต้องมี:</b> <code className="text-gray-800 font-mono bg-white px-1 rounded-sm">id</code>, <code className="text-gray-800 font-mono bg-white px-1 rounded-sm">name</code>, <code className="text-gray-800 font-mono bg-white px-1 rounded-sm">price</code>.</p>
                <p className="mt-1"><b>สำหรับตัวเลือกสินค้า (ถ้ามี):</b> <code className="text-gray-800 font-mono bg-white px-1 rounded-sm">option_group_name</code>, <code className="text-gray-800 font-mono bg-white px-1 rounded-sm">option_name</code>, <code className="text-gray-800 font-mono bg-white px-1 rounded-sm">option_price_modifier</code>.</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-grow">
                    <input
                        id="menu-file-import"
                        type="file"
                        accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        onChange={handleMenuFileChange}
                        className="hidden"
                    />
                    <label htmlFor="menu-file-import" className="flex items-center gap-4 cursor-pointer">
                        <span className="flex-shrink-0 py-1.5 px-4 rounded-md border-0 text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                            Choose File
                        </span>
                        <span className="text-sm text-gray-500 truncate" title={selectedFileName}>
                            {selectedFileName || 'No file chosen'}
                        </span>
                    </label>
                </div>
                {pendingImportMenu && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-green-800 bg-green-200 py-1 px-2 rounded-md">
                            พบ {pendingImportCount} รายการ
                        </span>
                        <button 
                            onClick={handleConfirmImport} 
                            className="text-sm bg-green-500 text-white hover:bg-green-600 font-semibold py-1.5 px-3 rounded-md transition-colors"
                        >
                            นำเข้า
                        </button>
                    </div>
                )}
                {importedMenu && !pendingImportMenu && (
                    <button 
                        onClick={handleClearImportedMenu} 
                        className="text-sm bg-red-100 text-red-700 hover:bg-red-200 font-semibold py-1.5 px-3 rounded-md transition-colors"
                        title="ลบเมนูที่นำเข้าและกลับไปใช้เมนูตั้งต้น"
                    >
                        ล้าง
                    </button>
                )}
            </div>
          </div>


          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm w-full min-h-[20px]">
                  <MenuStatusDisplay />
              </div>
              <button
                onClick={handleSavePosSettings}
                className={`font-bold py-2 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors w-full sm:w-auto
                  ${saveStatus === 'saved' ? 'bg-green-500 text-white focus:ring-green-500' : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500'}
                `}
              >
                {saveStatus === 'saved' ? 'บันทึกแล้ว!' : 'บันทึกการตั้งค่า'}
              </button>
          </div>
        </div>


        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">1. อัปโหลดรูปภาพใบเสร็จ</h2>
              <ImageUploader onImageChange={handleImageChange} imageUrl={imageUrl} />
            </div>

            <div className="mt-8 md:mt-0">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">2. ประมวลผลข้อมูล</h2>
              <button
                onClick={handleProcessReceipt}
                disabled={!imageFile || isLoading}
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center text-lg"
              >
                {isLoading ? <Spinner /> : '🚀 เริ่มประมวลผล'}
              </button>
              {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>
          </div>

          { (isLoading || extractedData) && <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">3. ตรวจสอบและยืนยันการจับคู่เมนู</h2>
            {isLoading ? (
              <div className="text-center p-8">
                <div className="flex justify-center items-center mb-4">
                  <Spinner />
                </div>
                <p className="text-gray-600 animate-pulse">กำลังใช้ AI วิเคราะห์และจับคู่เมนู... กรุณารอสักครู่</p>
              </div>
            ) : (
              extractedData && <ResultsDisplay data={extractedData} posEndpoint={posApiEndpoint} printerIp={printerIp} printerPort={printerPort} printerPaperSize={printerPaperSize} posMenu={posMenu} onItemMap={handleItemMap} />
            )}
          </div>}

        </div>
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Google Gemini API</p>
        </footer>
      </main>
    </div>
  );
};

export default App;