import type { PosMenuItem } from '../types';

const tsvData = `
id	name	price	category	image_url	cooking_time	option_group_name	option_group_type	option_group_required	option_name	option_price_modifier	option_is_default
9	ซุปกิมจิ	119	เมนู ซุป	https://i.postimg.cc/DypLL0Yx/1-k-mc-c-ke-s-pk-mc-Kimchi-Jjigae-Pork-and-Fish-th-wymi-m-can-rxng.png	15	เนื้อ	single	TRUE	มังสวิรัติ	0	FALSE
9	ซุปกิมจิ	119	เมนู ซุป	https://i.postimg.cc/DypLL0Yx/1-k-mc-c-ke-s-pk-mc-Kimchi-Jjigae-Pork-and-Fish-th-wymi-m-can-rxng.png	15	เนื้อ	single	TRUE	หมู	0	FALSE
9	ซุปกิมจิ	119	เมนู ซุป	https://i.postimg.cc/DypLL0Yx/1-k-mc-c-ke-s-pk-mc-Kimchi-Jjigae-Pork-and-Fish-th-wymi-m-can-rxng.png	15	เนื้อ	single	TRUE	ปลา	0	FALSE
9	ซุปกิมจิ	119	เมนู ซุป	https://i.postimg.cc/DypLL0Yx/1-k-mc-c-ke-s-pk-mc-Kimchi-Jjigae-Pork-and-Fish-th-wymi-m-can-rxng.png	15	รสเผ็ด	single	TRUE	ไม่เผ็ด (ไม่ใส่พริก)	0	FALSE
9	ซุปกิมจิ	119	เมนู ซุป	https://i.postimg.cc/DypLL0Yx/1-k-mc-c-ke-s-pk-mc-Kimchi-Jjigae-Pork-and-Fish-th-wymi-m-can-rxng.png	15	รสเผ็ด	single	TRUE	เผ็ดน้อย	0	FALSE
9	ซุปกิมจิ	119	เมนู ซุป	https://i.postimg.cc/DypLL0Yx/1-k-mc-c-ke-s-pk-mc-Kimchi-Jjigae-Pork-and-Fish-th-wymi-m-can-rxng.png	15	รสเผ็ด	single	TRUE	เผ็ดปกติ	0	FALSE
9	ซุปกิมจิ	119	เมนู ซุป	https://i.postimg.cc/DypLL0Yx/1-k-mc-c-ke-s-pk-mc-Kimchi-Jjigae-Pork-and-Fish-th-wymi-m-can-rxng.png	15	รสเผ็ด	single	TRUE	เผ็ดมาก	0	FALSE
10	ซุนดูบูจิเก (ซุปเต้าหู้อ่อน)	119	เมนู ซุป	https://i.postimg.cc/DzjM73TC/2-s-nd-b-c-ke-s-pte-ah-x-xn-Sundubu-Jjigae-mi-m-can-rxng.png	15						
11	ดุ๊กบลู	119	เมนู ซุป	https://i.postimg.cc/HkWznvBp/3-d-kb-l-s-phm-b-lkok-n-ada-Dduk-Bul-mi-m-can-rxng.png	15						
12	กิมจิ บกกึมบับ (ข้าวผัดกิมจิ)	99	เมนู ข้าว	https://i.postimg.cc/yxMN5Gxy/4-k-mc-bkk-mb-b-kh-awph-dk-mc-Kimchi-Bokeum-Bap.png	15	แบบ	single	TRUE	ธรรมดา	0	FALSE
12	กิมจิ บกกึมบับ (ข้าวผัดกิมจิ)	99	เมนู ข้าว	https://i.postimg.cc/yxMN5Gxy/4-k-mc-bkk-mb-b-kh-awph-dk-mc-Kimchi-Bokeum-Bap.png	15	แบบ	single	TRUE	มังสวิรัติ	0	FALSE
12	กิมจิ บกกึมบับ (ข้าวผัดกิมจิ)	99	เมนู ข้าว	https://i.postimg.cc/yxMN5Gxy/4-k-mc-bkk-mb-b-kh-awph-dk-mc-Kimchi-Bokeum-Bap.png	15	ไข่ดาว	single	TRUE	ไข่ดาว สุก	0	FALSE
12	กิมจิ บกกึมบับ (ข้าวผัดกิมจิ)	99	เมนู ข้าว	https://i.postimg.cc/yxMN5Gxy/4-k-mc-bkk-mb-b-kh-awph-dk-mc-Kimchi-Bokeum-Bap.png	15	ไข่ดาว	single	TRUE	ไข่ดาว ไม่สุก	0	FALSE
13	เจยุก ด๊อบบับ (ข้าวผัดหน้าเนื้อผัดซอสโคชูจัง)	99	เมนู ข้าว	https://i.postimg.cc/4dbkZFWY/5-cey-k-d-xbb-b-kh-awhn-ahm-ki-ph-d-sxs-khoch-c-ng-Jaeyuk-Dobbab.png	15	เนื้อ	single	TRUE	หมู	0	FALSE
13	เจยุก ด๊อบบับ (ข้าวผัดหน้าเนื้อผัดซอสโคชูจัง)	99	เมนู ข้าว	https://i.postimg.cc/4dbkZFWY/5-cey-k-d-xbb-b-kh-awhn-ahm-ki-ph-d-sxs-khoch-c-ng-Jaeyuk-Dobbab.png	15	เนื้อ	single	TRUE	ไก่	0	FALSE
14	บุลโกกิ ด๊อบบับ (ข้าวหน้าเนื้อ)	109	เมนู ข้าว	https://i.postimg.cc/Vkd1mBrq/b-lkok-d-xbb-b.jpg	15	เนื้อ	single	TRUE	หมู	0	FALSE
14	บุลโกกิ ด๊อบบับ (ข้าวหน้าเนื้อ)	109	เมนู ข้าว	https://i.postimg.cc/Vkd1mBrq/b-lkok-d-xbb-b.jpg	15	เนื้อ	single	TRUE	วัว	10	FALSE
15	จาจังบับ (ข้าวหน้าซอสจาจัง)	129	เมนู ข้าว	https://i.postimg.cc/tTmNQjLY/10-cac-ngb-b-kh-awhn-a-sxs-cac-ng-Jajangbab.png	15	ไข่ดาว	single	TRUE	ไข่ดาว สุก	0	FALSE
15	จาจังบับ (ข้าวหน้าซอสจาจัง)	129	เมนู ข้าว	https://i.postimg.cc/tTmNQjLY/10-cac-ngb-b-kh-awhn-a-sxs-cac-ng-Jajangbab.png	15	ไข่ดาว	single	TRUE	ไข่ดาว ไม่สุก	0	FALSE
16	บิบิมบับ (ข้าวยำเกาหลี)	149	เมนู ข้าว	https://i.postimg.cc/Yqb3HQYM/22-dol-sdb-b-b-mb-b-kh-aw-ya-kea-hl-hm-xr-xn-Dolsot-Bibimbap.png	15	แบบ	single	TRUE	ธรรมดา	0	FALSE
16	บิบิมบับ (ข้าวยำเกาหลี)	149	เมนู ข้าว	https://i.postimg.cc/Yqb3HQYM/22-dol-sdb-b-b-mb-b-kh-aw-ya-kea-hl-hm-xr-xn-Dolsot-Bibimbap.png	15	แบบ	single	TRUE	มังสวิรัติ	0	FALSE
17	หมูย่างเกาหลี	149	อาหารจานหลัก	https://i.postimg.cc/7LmD1s2w/13-hm-y-ang-kea-hl-Pork-ssam.png	15	แบบ	single	TRUE	ธรรมดา	0	FALSE
17	หมูย่างเกาหลี	149	อาหารจานหลัก	https://i.postimg.cc/7LmD1s2w/13-hm-y-ang-kea-hl-Pork-ssam.png	15	แบบ	single	TRUE	โคชูจัง	0	FALSE
18	บุนดักบกกึมเมี่ยน (มาม่าแห้งเผ็ดชีส)	0	เมนู เส้น	https://i.postimg.cc/wvg2z2fN/7-b-nd-kbkk-mme-yn-mam-ahae-ngphe-dch-s-Buldak.png	15	แบบ	single	TRUE	ธรรมดา	0	FALSE
18	บุนดักบกกึมเมี่ยน (มาม่าแห้งเผ็ดชีส)	0	เมนู เส้น	https://i.postimg.cc/wvg2z2fN/7-b-nd-kbkk-mme-yn-mam-ahae-ngphe-dch-s-Buldak.png	15	แบบ	single	TRUE	มังสวิรัติ	0	FALSE
18	บุนดักบกกึมเมี่ยน (มาม่าแห้งเผ็ดชีส)	0	เมนู เส้น	https://i.postimg.cc/wvg2z2fN/7-b-nd-kbkk-mme-yn-mam-ahae-ngphe-dch-s-Buldak.png	15	รสเผ็ด	single	TRUE	ไม่เผ็ด (ไม่ใส่พริก๗	0	FALSE
18	บุนดักบกกึมเมี่ยน (มาม่าแห้งเผ็ดชีส)	0	เมนู เส้น	https://i.postimg.cc/wvg2z2fN/7-b-nd-kbkk-mme-yn-mam-ahae-ngphe-dch-s-Buldak.png	15	รสเผ็ด	single	TRUE	เผ็ดน้อย	0	FALSE
18	บุนดักบกกึมเมี่ยน (มาม่าแห้งเผ็ดชีส)	0	เมนู เส้น	https://i.postimg.cc/wvg2z2fN/7-b-nd-kbkk-mme-yn-mam-ahae-ngphe-dch-s-Buldak.png	15	รสเผ็ด	single	TRUE	เผ็ดปกติ	0	FALSE
18	บุนดักบกกึมเมี่ยน (มาม่าแห้งเผ็ดชีส)	0	เมนู เส้น	https://i.postimg.cc/wvg2z2fN/7-b-nd-kbkk-mme-yn-mam-ahae-ngphe-dch-s-Buldak.png	15	รสเผ็ด	single	TRUE	เผ็ดมาก	0	FALSE
19	บูเดจิเก (มาม่าต้มทรงเครื่อง)	129	เมนู เส้น	https://i.postimg.cc/5yv8FFRM/8-b-dec-ke-mam-at-m-thrng-kher-xng-Budae-jjigae.png	15						
20	จาจังมยอน (บะหมี่ซอสดำ)	129	เมนู เส้น	https://i.postimg.cc/6Q2q3xS9/9-cac-ngm-yxn-bahm-sxs-da-Jajangmyoun.png	15						
21	กิมจิบิบิมกุกซู (บะหมี่ยำเกาหลี)	99	เมนู เส้น	https://i.postimg.cc/hjckY99g/12-k-mc-b-b-mk-ks-bahm-ya-kea-hl-Kimchi-bibim-Guksu.png	15	แบบ	single	TRUE	ธรรมดา	0	FALSE
21	กิมจิบิบิมกุกซู (บะหมี่ยำเกาหลี)	99	เมนู เส้น	https://i.postimg.cc/hjckY99g/12-k-mc-b-b-mk-ks-bahm-ya-kea-hl-Kimchi-bibim-Guksu.png	15	แบบ	single	TRUE	มังสวิรัติ	0	FALSE
22	ต๊อกบกกี (ต๊อกผัดซอสเกาหลี)	109	เมนู เส้น	https://i.postimg.cc/QtFyw0HT/11-t-xk-bkk-t-xkph-d-sxs-kea-hl-Tokbokki.png	15	แบบ	single	TRUE	เพิ่มชีส	10	FALSE
22	ต๊อกบกกี (ต๊อกผัดซอสเกาหลี)	109	เมนู เส้น	https://i.postimg.cc/QtFyw0HT/11-t-xk-bkk-t-xkph-d-sxs-kea-hl-Tokbokki.png	15	แบบ	single	TRUE	มังสวิรัติ	0	FALSE
23	จับเช (ผัดวุ้นเส้นเกาหลีเส้นเกาหลี)	119	เมนู เส้น	https://i.postimg.cc/DyvqzmPM/23-c-bche-ph-dw-nse-n-kea-hl-se-n-kea-hl-Japchae.png	15	แบบ	single	TRUE	ธรรมดา	0	FALSE
23	จับเช (ผัดวุ้นเส้นเกาหลีเส้นเกาหลี)	119	เมนู เส้น	https://i.postimg.cc/DyvqzmPM/23-c-bche-ph-dw-nse-n-kea-hl-se-n-kea-hl-Japchae.png	15	แบบ	single	TRUE	มังสวิรัติ	0	FALSE
24	เจยุก บกกึม หมู/ไก่ผัดซอสโคชูจัง (กับข้าว)	119	อาหารจานหลัก	https://i.postimg.cc/L5cKNGDQ/6-cey-k-bkk-m-hm-ki-ph-d-sxs-khoch-c-ng-k-bkh-aw-Jaeyuk-Bokeum.png	15	เนื้อ	single	TRUE	ไก่	0	FALSE
24	เจยุก บกกึม หมู/ไก่ผัดซอสโคชูจัง (กับข้าว)	119	อาหารจานหลัก	https://i.postimg.cc/L5cKNGDQ/6-cey-k-bkk-m-hm-ki-ph-d-sxs-khoch-c-ng-k-bkh-aw-Jaeyuk-Bokeum.png	15	เนื้อ	single	TRUE	หมู	0	FALSE
25	ยังนยอมชิ้กเก้น (ไก่ทอดซอสเกาหลี)	99	เมนู ทานเล่น	https://i.postimg.cc/25btX0qd/15-y-ngn-yxm-ch-kke-n-ki-thxd-sxs-kea-hl-Yangnyoum-Chicken.png	15						
26	ซาวครีม ชิ้กเก้น (ไก่ทอดซอสซาวครีม)	109	เมนู ทานเล่น	https://i.postimg.cc/KYM954VN/16-saw-khr-m-ch-kke-n-ki-thxd-sxs-saw-khr-m-Sour-cream-Chicken.png	15						
27	นักจิจอท กิมจิ (หนวดปลาหมึก)	99	เมนู ทานเล่น	https://i.postimg.cc/43kvsPLw/21-n-kc-cxth-k-mc-hnwd-pla-hm-k-Nakji-Geot.png	15						
28	ต๊อกคชชี่ (ต๊อกล้วนทอดซอสเกาหลี)	89	เมนู ทานเล่น	https://i.postimg.cc/4yq7w4jc/17-t-xk-khchch-t-xkl-wn-thxd-sxs-kea-hl-Yangnyoum-Ddok.png	15						
29	ซอซอสต๊อกบกกี (ต๊อกไส้กรอกทอดซอสเกาหลี)	89	เมนู ทานเล่น	https://i.postimg.cc/T1LhyMhJ/18-sx-sxs-t-xk-bkk-t-xksi-krxk-thxd-sxs-kea-hl-Sotoksotok.png	15						
30	คิมมาริ (สาหร่ายห่อวุ้นเส้นทอด)	79	เมนู ทานเล่น	https://i.postimg.cc/yYRTJWJ9/19-kh-mmar-sahr-ayh-xw-nse-nthxd-Kimmari.png	15						
31	กุนมันดู (เกี๊ยวทอดเกาหลี)	79	เมนู ทานเล่น	https://i.postimg.cc/zXYgc7Bx/20-k-nm-nd-ke-yw-thxd-kea-hl-Kunmandu.png	15						
32	คเยรันจิม (ไข่ตุ๋นเกาหลี)	99	เมนู ทานเล่น	https://i.postimg.cc/y6mdkH1Z/25-khyer-nc-m-khi-t-n-kea-hl.png	15						
33	ข้าวสวยเกาหลี	19	เมนู ทานเล่น	https://i.postimg.cc/Qx6jTNRK/26-kh-aw-swy.png	15						
34	กิมจิผักกาด	29	เมนู ทานเล่น	https://i.postimg.cc/T1YZdgYv/k-mc-kher-xngkhe-yng.png	15						
35	ไชเท้าดอง	29	เมนู ทานเล่น	https://i.postimg.cc/KvTdZGxH/kher-xngkhe-yng.png	15						
36	กิมจิไชเท้า	29	เมนู ทานเล่น	https://i.postimg.cc/G2N5CNNC/k-mc-chithe-a-kher-xngkhe-yng.png	15						
37	ไชเท้าขาว 	29	เมนู ทานเล่น	https://i.postimg.cc/zXkFw6jC/chithe-akhaw-kher-xngkhe-yng.png	15						
`;

const parseTsvToMenu = (tsv: string): PosMenuItem[] => {
  const lines = tsv.trim().split('\n');
  const headers = lines[0].split('\t');
  const idIndex = headers.indexOf('id');
  const nameIndex = headers.indexOf('name');
  const priceIndex = headers.indexOf('price');
  const optionGroupNameIndex = headers.indexOf('option_group_name');
  const optionNameIndex = headers.indexOf('option_name');
  const optionPriceModifierIndex = headers.indexOf('option_price_modifier');

  if (idIndex === -1 || nameIndex === -1 || priceIndex === -1) {
    console.error("TSV headers are missing required columns: id, name, price");
    return [];
  }

  const menuItemsMap = new Map<string, PosMenuItem>();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t');
    const id = values[idIndex];
    const name = values[nameIndex];
    const price = parseFloat(values[priceIndex]);

    if (id && name && !isNaN(price)) {
      let item = menuItemsMap.get(id);
      if (!item) {
        item = { id, name, price, options: [] };
        menuItemsMap.set(id, item);
      }

      const groupName = values[optionGroupNameIndex];
      const optionName = values[optionNameIndex];
      if (groupName && optionName) {
        const priceModifier = parseFloat(values[optionPriceModifierIndex] || '0');
        item.options.push({
          groupName: groupName.trim(),
          name: optionName.trim(),
          priceModifier: !isNaN(priceModifier) ? priceModifier : 0,
        });
      }
    }
  }

  return Array.from(menuItemsMap.values());
};

export const posMenuData: PosMenuItem[] = parseTsvToMenu(tsvData);