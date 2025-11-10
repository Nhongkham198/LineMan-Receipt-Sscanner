import React, { useState, useMemo } from 'react';
import type { ReceiptData, PosMenuItem } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { SendIcon } from './icons/SendIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { Spinner } from './Spinner';
import { sendToPOS } from '../services/posService';
import { printScannedItemsList, generateScannedItemsText } from '../services/printService';
import { PrintPreviewModal } from './PrintPreviewModal';


interface ResultsDisplayProps {
  data: ReceiptData;
  posEndpoint: string;
  printerIp: string;
  printerPort: string;
  printerPaperSize: '58' | '80';
  posMenu: PosMenuItem[];
  onItemMap: (itemIndex: number, selectedPosItem: PosMenuItem | null) => void;
}

type ActionStatus = 'idle' | 'sending' | 'success' | 'error';

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data, posEndpoint, printerIp, printerPort, printerPaperSize, posMenu, onItemMap }) => {
  const [copyStatus, setCopyStatus] = useState('คัดลอก JSON');
  const [posSendStatus, setPosSendStatus] = useState<ActionStatus>('idle');
  const [posSendMessage, setPosSendMessage] = useState('');
  
  const [printStatus, setPrintStatus] = useState<ActionStatus>('idle');
  const [printMessage, setPrintMessage] = useState('');
  
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [printPreviewContent, setPrintPreviewContent] = useState<string>('');
  
  const [printSourceName, setPrintSourceName] = useState<'original' | 'pos'>('pos');


  const mappedTotal = useMemo(() => {
    return data.items.reduce((acc, item) => {
        const price = item.finalPrice ?? item.selectedPosItem?.price ?? 0;
        return acc + (price * item.quantity);
    }, 0);
  }, [data.items]);

  const allItemsMapped = useMemo(() => {
    return data.items.every(item => item.selectedPosItem !== null);
  }, [data.items]);

  const handleCopy = () => {
    const dataToCopy = {
        mappedItems: data.items.map(i => ({
          ...i.selectedPosItem,
          price: i.finalPrice ?? i.selectedPosItem?.price,
          quantity: i.quantity
        })),
        newTotal: mappedTotal
    }
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
    setCopyStatus('คัดลอกแล้ว!');
    setTimeout(() => setCopyStatus('คัดลอก JSON'), 2000);
  };

  const handleSendToPOS = async () => {
    if (!allItemsMapped) return;
    setPrintStatus('idle'); // Clear other action status
    setPrintMessage('');
    setPosSendStatus('sending');
    setPosSendMessage('');
    try {
      const result = await sendToPOS(data.items, posEndpoint);
      if (result.success) {
        setPosSendStatus('success');
        setPosSendMessage(result.message);
        setTimeout(() => {
          setPosSendStatus('idle');
          setPosSendMessage('');
        }, 4000);
      } else {
        setPosSendStatus('error');
        setPosSendMessage(result.message);
      }
    } catch (err) {
      setPosSendStatus('error');
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดไม่คาดคิด';
      setPosSendMessage(message);
    }
  };
  
  const handleShowPrintPreview = () => {
    if (!printerIp) return;
    const content = generateScannedItemsText(data, printerPaperSize, printSourceName);
    setPrintPreviewContent(content);
    setShowPrintPreview(true);
  };
  
  const handleConfirmPrint = async () => {
    setShowPrintPreview(false); // Close modal first
    if (!printerIp || !printerPort) return;
    
    setPosSendStatus('idle'); // Clear other action status
    setPosSendMessage('');
    setPrintStatus('sending');
    setPrintMessage('');

    try {
      // We use the pre-generated content for printing
      const result = await printScannedItemsList(printPreviewContent, printerIp, printerPort);
       if (result.success) {
        setPrintStatus('success');
        setPrintMessage(result.message);
        setTimeout(() => {
          setPrintStatus('idle');
        }, 3000);
      } else {
        setPrintStatus('error');
        setPrintMessage(result.message);
      }
    } catch (err) {
      setPrintStatus('error');
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดไม่คาดคิด';
      setPrintMessage(message);
    }
  };


  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || typeof amount === 'undefined') return 'N/A';
    return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  const isPrinterConfigured = printerIp && printerIp.trim() !== '' && printerPort && printerPort.trim() !== '';
  const isPosConfigured = posEndpoint && posEndpoint.trim() !== '';

  const getSendButtonTitle = () => {
    if (!isPosConfigured) return "กรุณาตั้งค่า POS API ให้ถูกต้อง";
    if (!allItemsMapped) return "กรุณาจับคู่เมนูทุกรายการก่อนส่ง";
    return "ส่งข้อมูลไปยังระบบ POS";
  }


  return (
    <>
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        onConfirm={handleConfirmPrint}
        content={printPreviewContent}
        title={`ตัวอย่างก่อนพิมพ์ (${printerPaperSize}mm)`}
      />
      <div className="bg-gray-50 p-6 rounded-lg shadow-inner animate-fade-in">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <h3 className="text-xl font-bold text-gray-800">จับคู่รายการอาหาร</h3>
          <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopy}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors disabled:opacity-50"
              >
                <ClipboardIcon className="w-4 h-4 mr-2"/>
                {copyStatus}
              </button>
              <button
                  onClick={() => {
                    // Allow re-trying from an error state
                    if (posSendStatus === 'error') setPosSendStatus('idle');
                    handleSendToPOS();
                  }}
                  title={getSendButtonTitle()}
                  className={`
                      px-4 py-1.5 rounded-md text-sm font-medium flex items-center justify-center transition-all duration-300 min-w-[140px]
                      ${posSendStatus === 'idle' && isPosConfigured && allItemsMapped ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                      ${posSendStatus === 'sending' ? 'bg-blue-500 text-white' : ''}
                      ${posSendStatus === 'success' ? 'bg-green-600 text-white' : ''}
                      ${posSendStatus === 'error' ? 'bg-red-500 text-white hover:bg-red-600' : ''}
                      ${!isPosConfigured || !allItemsMapped ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}
                  `}
                  disabled={!isPosConfigured || !allItemsMapped || posSendStatus === 'sending'}
              >
                {posSendStatus === 'sending' ? <Spinner /> : <SendIcon className="w-4 h-4 mr-2"/>}
                {posSendStatus === 'idle' ? 'ส่งไปยัง POS' : posSendStatus === 'sending' ? 'กำลังส่ง...' : posSendStatus === 'success' ? 'ส่งสำเร็จ!' : 'ลองอีกครั้ง'}
              </button>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-gray-200 bg-white mb-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h4 className="font-semibold text-gray-800">พิมพ์ใบสั่งอาหารเข้าครัว</h4>
                    <fieldset className="mt-2">
                        <legend className="sr-only">ตัวเลือกการพิมพ์: เลือกชื่อรายการที่จะพิมพ์</legend>
                        <div className="flex items-center space-x-6">
                            <label htmlFor="print-pos-name" className="flex items-center cursor-pointer">
                                <input type="radio" id="print-pos-name" name="printSourceName" value="pos" checked={printSourceName === 'pos'} onChange={() => setPrintSourceName('pos')} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"/>
                                <span className="ml-2 text-sm text-gray-700">ใช้ชื่อเมนู POS</span>
                            </label>
                            <label htmlFor="print-original-name" className="flex items-center cursor-pointer">
                                <input type="radio" id="print-original-name" name="printSourceName" value="original" checked={printSourceName === 'original'} onChange={() => setPrintSourceName('original')} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"/>
                                <span className="ml-2 text-sm text-gray-700">ใช้ชื่อที่สแกนได้</span>
                            </label>
                        </div>
                    </fieldset>
                </div>
                <button
                    onClick={handleShowPrintPreview}
                    title={isPrinterConfigured ? "พิมพ์รายการที่เลือก" : "กรุณาตั้งค่า Printer IP Address และ Port"}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-all duration-300 min-w-[150px] ${!isPrinterConfigured ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    disabled={!isPrinterConfigured || printStatus === 'sending'}
                >
                    {printStatus === 'sending' ? <Spinner /> : <PrinterIcon className="w-4 h-4 mr-2"/>}
                    ดูตัวอย่างและพิมพ์
                </button>
            </div>
        </div>
        
        {posSendStatus === 'error' && posSendMessage && (
          <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm" role="alert">
            <strong className="font-bold">ส่ง POS ล้มเหลว: </strong>
            <span>{posSendMessage}</span>
          </div>
        )}

         {printStatus !== 'idle' && printMessage && (
          <div className={`my-4 p-3 rounded-md text-sm ${printStatus === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`} role="alert">
            <strong className="font-bold">{printStatus === 'error' ? 'พิมพ์ล้มเหลว:' : 'สถานะการพิมพ์:'} </strong>
            <span>{printMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-200 text-gray-600">
                      <tr>
                          <th className="p-3 font-semibold w-2/5">รายการที่สแกนได้</th>
                          <th className="p-3 font-semibold w-2/5">เมนูในระบบ POS</th>
                          <th className="p-3 font-semibold text-center">จำนวน</th>
                          <th className="p-3 font-semibold text-right">ราคาใหม่</th>
                          <th className="p-3 font-semibold text-center">จับคู่</th>
                      </tr>
                  </thead>
                  <tbody>
                      {data.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200 last:border-b-0">
                              <td className="p-3 text-gray-600">{item.originalName}</td>
                              <td className="p-2">
                                  <select 
                                    value={item.selectedPosItem?.id ?? ''}
                                    onChange={(e) => {
                                        const selectedId = e.target.value;
                                        const selectedItem = posMenu.find(menuItem => String(menuItem.id) === selectedId) || null;
                                        onItemMap(index, selectedItem);
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 bg-white font-semibold text-gray-800"
                                  >
                                    <option value="" disabled>--- เลือกเมนู ---</option>
                                    {posMenu.map(menuItem => (
                                      <option key={menuItem.id} value={menuItem.id}>
                                        {menuItem.name} ({formatCurrency(menuItem.price)})
                                      </option>
                                    ))}
                                  </select>
                              </td>
                              <td className="p-3 text-center text-gray-800">{item.quantity}</td>
                              <td className="p-3 text-right font-semibold text-gray-800">
                                  {formatCurrency(((item.finalPrice ?? item.selectedPosItem?.price ?? 0)) * item.quantity)}
                              </td>
                              <td className="p-3 text-center align-middle">
                                {item.selectedPosItem && typeof item.matchConfidence !== 'undefined' && (
                                  item.matchConfidence >= 0.9 ? (
                                    // FIX: Replaced title attribute with <title> element for SVG accessibility and to fix TypeScript error.
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <title>{`Match Confidence: ${Math.round(item.matchConfidence * 100)}%`}</title>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    // FIX: Replaced title attribute with <title> element for SVG accessibility and to fix TypeScript error.
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <title>{`Match Confidence: ${Math.round(item.matchConfidence * 100)}%`}</title>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )
                                )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>

          <div className="pt-4 space-y-2">
              {!allItemsMapped && (
                <p className="text-center text-sm text-yellow-600 bg-yellow-100 p-2 rounded-md">
                  กรุณาเลือกเมนูในระบบ POS ให้ครบทุกรายการ
                </p>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 border-t-2 border-gray-300 pt-2 mt-2">
                  <span>ยอดรวมสุทธิ (ใหม่)</span>
                  <span>{formatCurrency(mappedTotal)} บาท</span>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};