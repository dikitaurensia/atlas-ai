**Internal**

**ESB AtlasAI**

**Metodologi & Landasan Teori Perhitungan**

Dokumen ini menjelaskan rumus dan metode ilmiah yang menjadi fondasi kalkulasi skor lokasi dan estimasi profit pada fitur ESB AtlasAI, beserta referensi jurnal akademis pendukungnya.

| Dokumen | Metodologi & Landasan Teori — ESB AtlasAI |
| :---- | :---- |
| **Versi** | v1.0 |
| **Tanggal** | 21 Mei 2026 |
| **Referensi PRD** | PRD-ATLASAI-001 (ESB Style Edition) |

# **1\. Gambaran Umum Metodologi**

ESB AtlasAI menggunakan kombinasi tiga metode ilmiah yang telah teruji dan banyak digunakan dalam riset location intelligence global. Ketiga metode ini dipilih karena relevansinya dengan konteks bisnis FnB dan kemampuannya memanfaatkan data historis outlet ESB sebagai input utama.

| \# | Metode | Digunakan untuk | Jurnal Utama |
| ----- | ----- | ----- | ----- |
| 1 | **AHP — Analytic Hierarchy Process** | Menghitung bobot (weight) 5 dimensi skor dan kalkulasi Overall Score lokasi | *Timor & Sipahi (2005); Tzeng et al. (2002)* |
| 2 | **Huff Gravity Model** | Estimasi capture rate pelanggan dari area radius dan kalkulasi potensi revenue | *Huff (1963, 1964); ResearchGate (2025)* |
| 3 | **Analog Store Method** | Estimasi range profit bulanan berdasarkan performa outlet ESB existing yang serupa di area tersebut | *Han et al. (2024) — Journal of Business Research* |

# **2\. Metode 1 — AHP: Kalkulasi Skor Kelayakan Lokasi**

## **2.1 Landasan Teori**

Analytic Hierarchy Process (AHP) dikembangkan oleh Saaty (1980) sebagai metode pengambilan keputusan multi-kriteria yang memungkinkan penggunaan faktor kualitatif dan kuantitatif secara bersamaan. AHP banyak digunakan dalam penelitian pemilihan lokasi bisnis ritel dan restoran karena kemampuannya mengkombinasikan kriteria yang beragam menjadi satu skor komposit yang terukur dan transparan.

Dalam konteks pemilihan lokasi restoran fast food, Timor & Sipahi (2005) menggunakan AHP untuk menghitung bobot relatif setiap faktor lokasi melalui pairwise comparison antar kriteria, menghasilkan weight vector yang digunakan sebagai dasar kalkulasi skor akhir. Tzeng et al. (2002) mengaplikasikan pendekatan serupa untuk multi-criteria selection lokasi restoran di Taipei, memvalidasi AHP sebagai metode yang tepat untuk konteks FnB.

| 📖 Sumber: *Timor, M. & Sipahi, S. (2005). Fast-food restaurant site selection factor evaluation by the analytic hierarchy process. The Business Review, 4(1), 161–167.* |
| :---- |

| 📖 Sumber: *Tzeng, G.H., Teng, M.H., Chen, J.J., & Opricovic, S. (2002). Multicriteria selection for a restaurant location in Taipei. International Journal of Hospitality Management, 21(2), 171–187.* |
| :---- |

## **2.2 Penerapan di ESB AtlasAI**

ESB AtlasAI mengadaptasi metode AHP untuk menghitung Overall Score lokasi berdasarkan 5 dimensi. Bobot awal ditentukan berdasarkan kajian literatur dan akan divalidasi melalui analisis korelasi dengan data performa outlet ESB existing.

### **2.2.1 Lima Dimensi Skor dan Bobot Awal (W)**

| No | Dimensi | Bobot Awal (W) | Sumber Data | Justifikasi Bobot |
| ----- | ----- | :---: | ----- | ----- |
| 1 | **Traffic Pejalan Kaki (S₁)** | 30% | Google Places Popular Times API | Faktor penentu utama volume pelanggan potensial — berkorelasi langsung dengan revenue harian. |
| 2 | **Tingkat Persaingan (S₂)** | 25% | Google Places Nearby Search API | Kompetitor langsung di radius 500m menentukan market share yang bisa direbut. Bobot tinggi karena dampaknya langsung ke profit margin. |
| 3 | **Aksesibilitas (S₃)** | 20% | Google Maps Roads API \+ OSM | Kemudahan akses (jalan utama, transportasi, parkir) menentukan jangkauan catchment area. Didukung Song et al. (2025) — faktor transportasi signifikan untuk performa kafe. |
| 4 | **Kepadatan Penduduk (S₄)** | 15% | BPS Open Data API | Populasi dalam catchment area menentukan potential customer pool. Bobot lebih rendah karena efek populasi sudah sebagian ter-capture di skor traffic. |
| 5 | **Daya Beli Area (S₅)** | 10% | BPS PDRB \+ ESB avg. transaction data | Daya beli menentukan Average Transaction Value (ATV). Bobot lebih kecil karena untuk bisnis FnB mainstream, volume lebih krusial dari ATV. |
| **TOTAL** |  | **100%** |  | *Bobot divalidasi via analisis korelasi dengan 500+ outlet ESB (TODO: Data Science).* |

### **2.2.2 Rumus Overall Score**

Overall Score dihitung menggunakan weighted average dari 5 dimensi skor:

| Formula Overall Score (AHP Weighted Average) S\_overall \= (W₁ × S₁) \+ (W₂ × S₂) \+ (W₃ × S₃) \+ (W₄ × S₄) \+ (W₅ × S₅) S\_overall \= (0.30 × S₁) \+ (0.25 × S₂) \+ (0.20 × S₃) \+ (0.15 × S₄) \+ (0.10 × S₅) di mana:   Sᵢ  \= skor dimensi ke-i, dinormalisasi ke skala 0–100   Wᵢ  \= bobot dimensi ke-i (total \= 1.0) |
| :---- |

Contoh kalkulasi:

| Dimensi | Bobot (W) | Skor (S) | Kontribusi (W × S) |
| ----- | :---: | :---: | ----- |
| Traffic Pejalan Kaki | 0.30 | 82 | 0.30 × 82 \= 24.6 |
| Tingkat Persaingan | 0.25 | 58 | 0.25 × 58 \= 14.5 |
| Aksesibilitas | 0.20 | 70 | 0.20 × 70 \= 14.0 |
| Kepadatan Penduduk | 0.15 | 85 | 0.15 × 85 \= 12.75 |
| Daya Beli Area | 0.10 | 65 | 0.10 × 65 \= 6.5 |
| **OVERALL SCORE** | **1.00** | — | **24.6 \+ 14.5 \+ 14.0 \+ 12.75 \+ 6.5 \= 72.35 ≈ 72** |

### **2.2.3 Skala Grade Overall Score**

| Rentang Skor | Grade | Interpretasi |
| ----- | ----- | ----- |
| **80 – 100** | **Sangat Potensial** | Lokasi ideal — kombinasi traffic tinggi, kompetisi rendah, dan aksesibilitas baik. Rekomendasikan untuk lanjut ke negosiasi sewa. |
| 70 – 79 | Potensi Bagus | Lokasi layak dengan satu atau dua faktor yang perlu diperhatikan. Masih sangat viable untuk dibuka. |
| 60 – 69 | Cukup Potensial | Terdapat beberapa tantangan signifikan. Perlu analisis lebih dalam atau mempertimbangkan lokasi alternatif. |
| \< 60 | Kurang Ideal | Tidak direkomendasikan tanpa mitigasi khusus. Pertimbangkan lokasi lain. |

# **3\. Metode 2 — Huff Gravity Model: Estimasi Capture Rate Pelanggan**

## **3.1 Landasan Teori**

Huff Gravity Model (1963) adalah model probabilistik yang digunakan secara luas dalam riset ritel dan pemilihan lokasi toko. Model ini menghitung probabilitas seorang konsumen di area tertentu akan mengunjungi suatu toko berdasarkan daya tarik toko (attractiveness) dan jarak dari konsumen ke toko tersebut. Model ini terinspirasi dari Hukum Gravitasi Newton dan telah terbukti akurat dalam memprediksi market share outlet ritel di berbagai konteks.

Studi terbaru (ResearchGate, 2025\) mengkombinasikan Huff Model dengan data transaksi merchant nyata untuk mengestimasi revenue — pendekatan yang persis sama dengan yang digunakan ESB AtlasAI menggunakan data 30.000+ outlet aktif sebagai input kalibrasi model.

| 📖 Sumber: *Huff, D.L. (1963). A probability analysis of shopping center trade areas. Land Economics, 39, 81–90.* |
| :---- |

| 📖 Sumber: *Huff, D.L. (1964). Defining and estimating a trading area. The Journal of Marketing, 28(3), 34–38.* |
| :---- |

| 📖 Sumber: *ResearchGate (2025). Huff gravity model applications: A data driven machine learning model for store close decisions — Revenue Estimation for Attractiveness. https://doi.org/10.13140/RG.2.2.x* |
| :---- |

## **3.2 Rumus Huff Model**

Formula dasar Huff Model untuk menghitung probabilitas kunjungan:

| Formula Huff Gravity Model — Probabilitas Kunjungan Pᵢⱼ \= (Aⱼ / Tᵢⱼ^λ) / Σₖ (Aₖ / Tᵢₖ^λ) di mana:   Pᵢⱼ  \= Probabilitas konsumen dari area i mengunjungi toko j   Aⱼ   \= Daya tarik toko j (diproxy: rata-rata revenue outlet ESB kategori sama di area tersebut)   Tᵢⱼ  \= Waktu tempuh atau jarak dari titik i ke toko j   λ    \= Parameter sensitivitas jarak (dikalibrasi dari data ESB, nilai default: λ \= 2\)   Σₖ   \= Penjumlahan atas semua toko kompetitor k dalam radius analisis |
| :---- |

## **3.3 Penerapan di ESB AtlasAI — Estimasi Capture Rate**

ESB AtlasAI menggunakan Huff Model untuk menghitung capture rate, yaitu perkiraan proporsi total populasi dalam radius yang akan menjadi pelanggan bisnis di lokasi yang dianalisis:

| Formula Capture Rate & Estimasi Revenue CR \= Pᵢⱼ × Pop\_radius di mana:   CR          \= Estimated Customer Capture (jumlah pelanggan potensial per periode)   Pᵢⱼ         \= Probabilitas kunjungan dari Huff Model   Pop\_radius  \= Estimasi populasi dalam radius analisis (dari data BPS per kelurahan) Estimasi Revenue Harian:   R\_harian \= CR\_harian × ATV   ATV (Average Transaction Value) \= rata-rata nilai transaksi outlet ESB               sejenis dalam area tersebut (dari data internal ESB) |
| :---- |

## **3.4 Catatan Implementasi**

* Parameter λ (sensitivitas jarak) dikalibrasi dari data historis kunjungan outlet ESB di setiap kota. Nilai default λ \= 2 digunakan pada fase awal, diperbarui setelah data kalibrasi cukup.

* Untuk konteks FnB (bukan mall/hypermarket), Tᵢⱼ menggunakan jarak Euclidean yang dikonversi ke estimasi waktu berjalan kaki — karena sebagian besar pelanggan kuliner UMKM berasal dari radius \< 1km.

* Kompetitor k yang dihitung adalah outlet dengan kategori bisnis yang sama (filter dari Google Places API berdasarkan jenis bisnis yang dipilih user).

# **4\. Metode 3 — Analog Store Method: Estimasi Profit Berbasis Data ESB**

## **4.1 Landasan Teori**

Analog Store Method adalah pendekatan empiris yang menggunakan data performa toko-toko existing yang memiliki karakteristik serupa (analog stores) untuk mengestimasi potensi revenue di lokasi baru. Metode ini dipilih karena tidak memerlukan asumsi distribusi probabilitas tertentu — cukup menggunakan data aktual yang tersedia.

Han et al. (2024) dalam Journal of Business Research mengusulkan metode prescriptive analytics berbasis spatial data mining yang menggunakan kernel regression untuk mengestimasi potensi penjualan di lokasi baru berdasarkan kemiripan karakteristik dengan outlet existing. ESB AtlasAI mengadaptasi pendekatan ini dengan memanfaatkan data 30.000+ outlet aktif ESB sebagai dataset analog.

| 📖 Sumber: *Han, S. et al. (2024). Identifying a good business location using prescriptive analytics: Restaurant location recommendation based on spatial data mining. Journal of Business Research, ScienceDirect. https://doi.org/10.1016/j.jbusres.2024.114195* |
| :---- |

## **4.2 Rumus Estimasi Profit**

ESB AtlasAI menggunakan distribusi percentile dari revenue outlet analog untuk menghasilkan range estimasi profit yang realistis dan tidak menyesatkan:

| Formula Estimasi Profit (Percentile Distribution Method) Estimasi Profit Minimum  \= P10 (Revenue\_analog) Estimasi Profit Maksimum \= P90 (Revenue\_analog) di mana:   P10 \= Persentil ke-10 dari distribusi revenue bulanan          outlet ESB kategori sama dalam radius analisis          → Mewakili skenario konservatif / kondisi kurang ideal   P90 \= Persentil ke-90 dari distribusi revenue bulanan          outlet ESB kategori sama dalam radius analisis          → Mewakili skenario optimis / kondisi ideal   Profit ≈ Revenue × Margin\_kategori   (Margin\_kategori \= rata-rata profit margin per kategori bisnis    berdasarkan data internal ESB, estimasi awal: 20–35%) |
| :---- |

## **4.3 Kriteria Seleksi Outlet Analog**

Outlet ESB yang digunakan sebagai referensi (analog) harus memenuhi kriteria berikut untuk memastikan relevansi data:

| \# | Kriteria | Detail |
| ----- | ----- | ----- |
| 1 | **Kategori bisnis sama** | Outlet harus memiliki kategori yang identik dengan input user (ayam goreng, kopi, mie, dll.). Filter via tag kategori di database ESB. |
| 2 | **Dalam radius analisis** | Lokasi outlet analog berada dalam radius yang dipilih user (default 5km dari pin lokasi). Query via geospatial index (PostGIS). |
| 3 | **Status aktif** | Outlet harus berstatus aktif (status \= 'active') dalam database ESB — tidak termasuk outlet yang sudah tutup atau non-aktif. |
| 4 | **Data minimal 3 bulan** | Outlet harus memiliki minimal 3 bulan data transaksi untuk menghindari bias dari outlet baru yang belum stabil. |
| 5 | **Threshold minimum N ≥ 5** | Jika jumlah outlet analog yang memenuhi kriteria \< 5, estimasi profit tidak ditampilkan dan diganti pesan: "Data terbatas — estimasi tidak tersedia". |

## **4.4 Contoh Kalkulasi**

Ilustrasi: User memilih kategori Ayam Goreng di area Tebet, Jakarta Selatan, radius 5km.

| Parameter | Nilai Contoh |
| ----- | ----- |
| Kategori bisnis | Ayam Goreng |
| Radius analisis | 5km dari koordinat pilihan |
| Jumlah outlet analog ditemukan (N) | 47 outlet ESB aktif |
| Revenue P10 (persentil ke-10) | Rp 18.000.000 / bulan |
| Revenue P90 (persentil ke-90) | Rp 67.000.000 / bulan |
| Margin rata-rata kategori (estimasi) | 28% |
| **Estimasi Profit Minimum** | **Rp 18jt × 28% ≈ Rp 5jt / bulan** |
| **Estimasi Profit Maksimum** | **Rp 67jt × 28% ≈ Rp 19jt / bulan** |
| **Output AtlasAI** | **"Estimasi profit Rp 5jt – Rp 19jt / bulan. Berdasarkan 47 outlet ESB aktif dalam radius 5km."** |

# **5\. Validasi Empiris & Rencana Kalibrasi Model**

## **5.1 Justifikasi Pilihan 5 Dimensi**

Pemilihan 5 dimensi skor AtlasAI didukung oleh studi empiris Song et al. (2025) yang menganalisis faktor-faktor lokasi yang mempengaruhi performa outlet kafe (Luckin Coffee dan Starbucks) di Shanghai menggunakan data POI dan GIS. Studi tersebut secara eksplisit memvalidasi bahwa faktor-faktor berikut berkorelasi signifikan dengan performa outlet:

| 📖 Sumber: *Song, Y. et al. (2025). Site selection analysis and prediction of new retail stores: A case study of Luckin Coffee and Starbucks in Shanghai. ISPRS International Journal of Geo-Information, 14(6), 217\. https://www.mdpi.com/2220-9964/14/6/217* |
| :---- |

| Dimensi AtlasAI | Temuan Song et al. (2025) | Relevansi untuk FnB Indonesia |
| ----- | ----- | ----- |
| **Traffic Pejalan Kaki** | Foot traffic pejalan kaki dan proximity ke transportation hub adalah prediktor terkuat performa outlet | Bisnis FnB UMKM sangat bergantung pada pelanggan walk-in dan pelanggan yang lewat secara spontan |
| **Tingkat Persaingan** | Competitor density pada skala makro (radius besar) dan jarak ke kompetitor terdekat (skala mikro) keduanya signifikan | Saturasi kompetitor langsung mempengaruhi market share yang bisa direbut oleh pendatang baru |
| **Aksesibilitas** | Road network density dan proximity ke major roads / transit stations sangat disukai oleh bisnis kuliner | Kemudahan akses kendaraan dan angkutan umum langsung menentukan jangkauan catchment area |
| **Kepadatan Penduduk** | Population density dan housing prices merefleksikan land value dan local purchasing power | Kepadatan penduduk menentukan baseline demand — semakin padat, semakin besar potential customer pool |
| **Daya Beli Area** | Nighttime light intensity (proxy GDP) dan income indicators berkorelasi positif dengan performa outlet premium | Daya beli menentukan Average Transaction Value dan willingness to pay untuk kategori bisnis tertentu |

## **5.2 Rencana Kalibrasi & Validasi Model**

Bobot AHP awal yang diusulkan bersifat teoritis dan harus divalidasi menggunakan data aktual ESB sebelum launch production. Berikut rencana kalibrasi:

| No | Tahap | Detail | PIC & Timeline |
| ----- | ----- | ----- | ----- |
| 1 | **Pengumpulan Ground Truth Data** | Ambil data revenue historis 500+ outlet ESB aktif beserta skor 5 dimensi lokasi mereka (yang dihitung retroaktif via API). Dataset ini menjadi ground truth untuk kalibrasi. | Data Engineer — Sprint 2 |
| 2 | **Analisis Korelasi** | Hitung korelasi Pearson antara setiap skor dimensi dengan actual revenue. Dimensi dengan korelasi lebih tinggi mendapat bobot lebih besar dalam model final. | Data Scientist — Sprint 3 |
| 3 | **Optimasi Bobot via Regression** | Gunakan multiple linear regression atau XGBoost untuk mengoptimalkan bobot Wᵢ yang meminimalkan error prediksi revenue. Output: bobot final yang menggantikan bobot awal teoritis. | Data Scientist — Sprint 3–4 |
| 4 | **Kalibrasi λ Huff Model** | Kalibrasi parameter sensitivitas jarak (λ) per kota menggunakan data kunjungan pelanggan aktual outlet ESB (jika tersedia dari data mobile/GPS). Default λ \= 2 digunakan jika data belum cukup. | Data Scientist — Sprint 4 |
| 5 | **Back-testing Estimasi Profit** | Validasi estimasi profit dengan cara: prediksi profit untuk outlet ESB yang sudah exist → bandingkan dengan actual revenue mereka. Target: error \< 25% untuk 80% outlet dalam dataset validasi. | Data Scientist — Sprint 4–5 |

# **6\. Daftar Referensi**

Berikut adalah seluruh jurnal dan sumber akademis yang menjadi landasan metodologi ESB AtlasAI:

| \# | Kategori | Referensi Lengkap |
| ----- | ----- | ----- |
| 1 | **AHP — Lokasi Restoran** | Timor, M. & Sipahi, S. (2005). Fast-food restaurant site selection factor evaluation by the analytic hierarchy process. The Business Review, 4(1), 161–167. ResearchGate: https://www.researchgate.net/publication/285788604 |
| 2 | **MCDM — Lokasi Restoran** | Tzeng, G.H., Teng, M.H., Chen, J.J., & Opricovic, S. (2002). Multicriteria selection for a restaurant location in Taipei. International Journal of Hospitality Management, 21(2), 171–187. https://doi.org/10.1016/S0278-4319(02)00005-1 |
| 3 | **Huff Model — Klasik** | Huff, D.L. (1963). A probability analysis of shopping center trade areas. Land Economics, 39, 81–90. |
| 4 | **Huff Model — Trade Area** | Huff, D.L. (1964). Defining and estimating a trading area. The Journal of Marketing, 28(3), 34–38. https://doi.org/10.2307/1249154 |
| 5 | **Huff \+ ML — Revenue Estimation** | ResearchGate (2025). Huff gravity model applications: A data driven machine learning model for store close decisions — Revenue Estimation for Attractiveness. https://www.researchgate.net/publication/389361077 |
| 6 | **Analog Store \+ Spatial Mining** | Han, S. et al. (2024). Identifying a good business location using prescriptive analytics: Restaurant location recommendation based on spatial data mining. Journal of Business Research, ScienceDirect. https://doi.org/10.1016/j.jbusres.2024.114195 |
| 7 | **Faktor Lokasi Kafe — Empiris** | Song, Y. et al. (2025). Site selection analysis and prediction of new retail stores: A case study of Luckin Coffee and Starbucks in Shanghai. ISPRS International Journal of Geo-Information, 14(6), 217\. https://www.mdpi.com/2220-9964/14/6/217 |
| 8 | **Restaurant Analytics — Overview** | Roy, D., Spiliotopoulou, E., & de Vries, J. (2022). Restaurant analytics: Emerging practice and research opportunities. Production and Operations Management. Wiley / SAGE. https://onlinelibrary.wiley.com/doi/full/10.1111/poms.13809 |
| 9 | **Geomarketing — Bibliometrik** | MDPI ISPRS Journal of Geo-Information (2025). Where Business Meets Location Intelligence: A Bibliometric Analysis of Geomarketing Research in Retail. Vol. 14, No. 8\. https://www.mdpi.com/2220-9964/14/8/282 |
| 10 | **AHP — Fondasi Teoritis** | Saaty, T.L. (1980). The analytical hierarchy process: Planning, priority setting, resource allocation. New York: McGraw-Hill. \[Original AHP paper — fundamental reference\] |

*— End of Document —*