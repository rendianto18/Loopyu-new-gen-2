import { LevelConfig, TieredHint } from "../types";

/**
 * 5-Tier Progressive Assistance Engine for LOOPYU 2.0.
 *
 * Tier 1: Pertanyaan Pemandu (Mendorong siswa bernalar mandiri)
 * Tier 2: Petunjuk Konseptual (Menjelaskan logika perulangan atau kondisi)
 * Tier 3: Saran Kontekstual (Mengidentifikasi balok/wilayah kode yang perlu ditinjau)
 * Tier 4: Contoh Pola Serupa (Contoh analogi mini terpisah tanpa membocorkan jawaban langsung)
 * Tier 5: Penjelasan Struktur Solusi Lengkap (Panduan struktur langkah per langkah)
 */
export function getTieredHintsForLevel(level: LevelConfig): TieredHint[] {
  const hints: Record<number, TieredHint[]> = {
    1: [
      {
        tier: 1,
        title: "Pertanyaan Pemandu 🤔",
        badge: "Tingkat 1: Penalaran Mandiri",
        content:
          "Perhatikan posisi awal robot di petak (1,3) dan 2 baterai di (2,3) dan (3,3). Aksi apa yang harus dilakukan robot tepat setelah melangkah maju ke petak baterai?",
      },
      {
        tier: 2,
        title: "Petunjuk Konsep: Instruksi Sekuensial 💡",
        badge: "Tingkat 2: Konsep Dasar",
        content:
          "Dalam pemrograman sekuensial, setiap langkah dieksekusi satu per satu dari atas ke bawah. Berdiri di atas petak baterai tidak otomatis mengambilnya—kamu harus memanggil perintah khusus pengambilan.",
      },
      {
        tier: 3,
        title: "Saran Kontekstual Balok 🔍",
        badge: "Tingkat 3: Analisis Balok",
        content:
          "Tiga balok awal sudah tersusun: [MAJU] -> [AMBIL BATERAI] -> [MAJU]. Robot sudah tiba di atas baterai kedua, namun belum ada instruksi untuk menyimpannya ke inventaris.",
      },
      {
        tier: 4,
        title: "Contoh Pola Serupa 🧩",
        badge: "Tingkat 4: Pola Analogi",
        content:
          "Bayangkan kamu memungut 2 buah koin di lantai:\n1. Melangkah ke koin 1 -> Ambil koin 1\n2. Melangkah ke koin 2 -> Ambil koin 2\nSetiap langkah maju selalu berpasangan dengan aksi ambil!",
        exampleSnippet: "move(); collect(); move(); collect();",
      },
      {
        tier: 5,
        title: "Penjelasan Struktur Solusi 🎯",
        badge: "Tingkat 5: Struktur Solusi",
        content:
          "Tarik balok 'AMBIL BATERAI' dari palet dan pasang tepat di posisi paling bawah, sehingga urutan total menjadi 4 balok: MAJU -> AMBIL BATERAI -> MAJU -> AMBIL BATERAI.",
        codeIllustration: "// Solusi Lengkap:\nmove();\ncollect();\nmove();\ncollect();",
      },
    ],

    2: [
      {
        tier: 1,
        title: "Pertanyaan Pemandu 🤔",
        badge: "Tingkat 1: Penalaran Mandiri",
        content:
          "Ada 4 baterai berjejer lurus di depan robot, namun kamu dibatasi maksimal 4 balok. Pola gerakan apa yang berulang persis pada setiap baterai?",
      },
      {
        tier: 2,
        title: "Petunjuk Konsep: Perulangan FOR 💡",
        badge: "Tingkat 2: Konsep Loop FOR",
        content:
          "Loop FOR `for (int i = 0; i < N; i++)` digunakan saat kita sudah mengetahui pasti berapa kali tindakan harus diulang. Cukup masukkan 1 pasang aksi ke dalam wadah loop, dan komputer akan mengulanginya N kali!",
      },
      {
        tier: 3,
        title: "Saran Kontekstual Balok 🔍",
        badge: "Tingkat 3: Analisis Balok",
        content:
          "Tarik 1 balok FOR (repeat). Atur jumlah putarannya menjadi 4 kali. Di dalam wadah perulangan tersebut, masukkan balok MAJU dan AMBIL BATERAI.",
      },
      {
        tier: 4,
        title: "Contoh Pola Serupa 🧩",
        badge: "Tingkat 4: Pola Analogi",
        content:
          "Jika ada 10 bendera berjejer lurus:\nDaripada menulis 20 baris perintah manual, kita menulis:\nfor (int i = 0; i < 10; i++) {\n  maju();\n  ambilBendera();\n}",
        exampleSnippet: "for (int i = 0; i < 4; i++) {\n  move();\n  collect();\n}",
      },
      {
        tier: 5,
        title: "Penjelasan Struktur Solusi 🎯",
        badge: "Tingkat 5: Struktur Solusi",
        content:
          "Gunakan 1 wadah loop FOR (repeat 4). Masukkan balok MAJU lalu balok AMBIL BATERAI ke dalam wadah tersebut. Total hanya memakai 3 balok (sangat efisien!).",
        codeIllustration: "for (int i = 0; i < 4; i++) {\n    move();\n    collect();\n}",
      },
    ],

    3: [
      {
        tier: 1,
        title: "Pertanyaan Pemandu 🤔",
        badge: "Tingkat 1: Penalaran Mandiri",
        content:
          "Lintasan tangga memiliki 3 anak tangga. Amati perubahan posisi robot: setelah menaiki satu anak tangga dan mengambil baterai, ke mana robot harus menghadap agar siap menaiki anak tangga berikutnya?",
      },
      {
        tier: 2,
        title: "Petunjuk Konsep: Invarian Arah Hadap 💡",
        badge: "Tingkat 2: Konsep Perulangan",
        content:
          "Agar sebuah loop dapat mengulang siklus dengan sukses, posisi akhir haluan robot di akhir satu putaran harus kembali sama dengan posisi awal (misal: kembali menghadap KANAN).",
      },
      {
        tier: 3,
        title: "Saran Kontekstual Balok 🔍",
        badge: "Tingkat 3: Analisis Balok",
        content:
          "Satu siklus anak tangga membutuhkan 5 aksi: MAJU, BELOK KIRI, MAJU, AMBIL BATERAI, dan terakhir BELOK KANAN. Masukkan kelima balok ini ke dalam wadah loop FOR repeat 3 kali.",
      },
      {
        tier: 4,
        title: "Contoh Pola Serupa 🧩",
        badge: "Tingkat 4: Pola Analogi",
        content:
          "Pola zig-zag tangga:\nNaik satu tingkat = [Maju -> Kiri -> Maju -> Ambil -> Kanan].\nKarena ada 3 anak tangga, ulangi pola ini persis 3 kali dalam for-loop.",
        exampleSnippet: "for (int i = 0; i < 3; i++) {\n  // 1 siklus tangga\n}",
      },
      {
        tier: 5,
        title: "Penjelasan Struktur Solusi 🎯",
        badge: "Tingkat 5: Struktur Solusi",
        content:
          "Susun balok FOR (repeat 3). Di dalamnya masukkan urutan: MAJU -> BELOK KIRI -> MAJU -> AMBIL BATERAI -> BELOK KANAN.",
        codeIllustration:
          "for (int i = 0; i < 3; i++) {\n    move();\n    turnLeft();\n    move();\n    collect();\n    turnRight();\n}",
      },
    ],

    4: [
      {
        tier: 1,
        title: "Pertanyaan Pemandu 🤔",
        badge: "Tingkat 1: Penalaran Mandiri",
        content:
          "Robot berada di koridor panjang menuju dinding. Daripada menghitung jumlah petak secara manual, kondisi sensor apa yang bisa mendeteksi kapan robot harus terus maju dan kapan harus berhenti?",
      },
      {
        tier: 2,
        title: "Petunjuk Konsep: Perulangan WHILE 💡",
        badge: "Tingkat 2: Konsep Loop WHILE",
        content:
          "Loop `while (kondisi)` mengecek sensor terlebih dahulu. Selama kondisi jalan aman `pathClear()` bernilai BENAR (TRUE), robot melangkah maju. Saat tiba persis di depan dinding, kondisinya menjadi FALSE dan loop otomatis berhenti!",
      },
      {
        tier: 3,
        title: "Saran Kontekstual Balok 🔍",
        badge: "Tingkat 3: Analisis Balok",
        content:
          "Masukkan balok MAJU ke dalam loop 'WHILE path_clear'. Setelah robot berhenti tepat di depan dinding, letakkan balok AMBIL BATERAI di LUAR (di bawah) wadah loop.",
      },
      {
        tier: 4,
        title: "Contoh Pola Serupa 🧩",
        badge: "Tingkat 4: Pola Analogi",
        content:
          "Berjalan di koridor gelap hingga menyentuh pintu:\nwhile (jalanMasihAman()) {\n  melangkah();\n}\nbukaPintu(); // Dijalankan setelah berhenti!",
        exampleSnippet: "while (pathClear()) {\n  move();\n}\ncollect();",
      },
      {
        tier: 5,
        title: "Penjelasan Struktur Solusi 🎯",
        badge: "Tingkat 5: Struktur Solusi",
        content:
          "1. Balok WHILE (kondisi: path_clear) berisi balok MAJU.\n2. Balok AMBIL BATERAI diletakkan di bawah (setelah kurung tutup) wadah WHILE.",
        codeIllustration: "while (pathClear()) {\n    move();\n}\ncollect();",
      },
    ],

    5: [
      {
        tier: 1,
        title: "Pertanyaan Pemandu 🤔",
        badge: "Tingkat 1: Penalaran Mandiri",
        content:
          "Robot berada di lintasan bertingkat dengan 3 baterai di setiap sudut. Pola apa yang terjadi setiap kali robot selesai mengambil satu baterai?",
      },
      {
        tier: 2,
        title: "Petunjuk Konsep: Kombinasi Aksi & Perulangan 💡",
        badge: "Tingkat 2: Konsep Perulangan",
        content:
          "Pada loop FOR, pastikan menghitung jumlah siklus pengulangan dengan tepat. Jika di lintasan ada 3 baterai, maka perulangan harus disetel tepat 3 kali.",
      },
      {
        tier: 3,
        title: "Saran Kontekstual Balok 🔍",
        badge: "Tingkat 3: Analisis Balok",
        content:
          "Periksa hitungan loop: pastikan diset repeat 3 kali (bukan 5 kali). Di dalam wadah loop, robot melangkah MAJU lalu AMBIL BATERAI.",
      },
      {
        tier: 4,
        title: "Contoh Pola Serupa 🧩",
        badge: "Tingkat 4: Pola Analogi",
        content:
          "for (int i = 0; i < 3; i++) {\n  move();\n  collect();\n}\n// Memastikan loop tidak melompat melebihi jumlah baterai yang ada.",
      },
      {
        tier: 5,
        title: "Penjelasan Struktur Solusi 🎯",
        badge: "Tingkat 5: Struktur Solusi",
        content:
          "Gunakan loop FOR (repeat 3). Masukkan balok MAJU dan AMBIL BATERAI di dalamnya.",
        codeIllustration: "for (int i = 0; i < 3; i++) {\n    move();\n    collect();\n}",
      },
    ],

    6: [
      {
        tier: 1,
        title: "Pertanyaan Pemandu 🤔",
        badge: "Tingkat 1: Penalaran Mandiri",
        content:
          "Lintasan membentuk sudut siku-siku berbentuk huruf 'L'. Bagaimana memanfaatkan loop WHILE untuk menelusuri lorong pertama, lalu berbelok, dan menelusuri lorong kedua?",
      },
      {
        tier: 2,
        title: "Petunjuk Konsep: Rangkaian Dua Loop WHILE 💡",
        badge: "Tingkat 2: Sekuensial Multi-Loop",
        content:
          "Kamu dapat menyusun dua loop WHILE secara berurutan: Loop 1 membawa robot ke ujung lorong pertama, lalu perintah belokan mengubah arah hadap robot, dan Loop 2 membawa robot menelusuri lorong kedua.",
      },
      {
        tier: 3,
        title: "Saran Kontekstual Balok 🔍",
        badge: "Tingkat 3: Analisis Balok",
        content:
          "Urutan logika:\n1. WHILE (path_clear) { MAJU }\n2. BELOK KANAN\n3. WHILE (path_clear) { MAJU }\n4. AMBIL BATERAI",
      },
      {
        tier: 4,
        title: "Contoh Pola Serupa 🧩",
        badge: "Tingkat 4: Pola Analogi",
        content:
          "Navigasi koridor dua ruas:\nwhile (depanKosong) jalan();\nbelok();\nwhile (depanKosong) jalan();\nsampaiTujuan();",
        exampleSnippet: "while (pathClear()) move();\nturnRight();\nwhile (pathClear()) move();\ncollect();",
      },
      {
        tier: 5,
        title: "Penjelasan Struktur Solusi 🎯",
        badge: "Tingkat 5: Struktur Solusi",
        content:
          "Susun 4 bagian: Loop WHILE pertama (MAJU), lalu BELOK KANAN, lalu Loop WHILE kedua (MAJU), dan diakhiri dengan balok AMBIL BATERAI.",
        codeIllustration:
          "while (pathClear()) {\n    move();\n}\nturnRight();\nwhile (pathClear()) {\n    move();\n}\ncollect();",
      },
    ],

    7: [
      {
        tier: 1,
        title: "Pertanyaan Pemandu 🤔",
        badge: "Tingkat 1: Penalaran Mandiri",
        content:
          "Sirkuit ini berbentuk bujur sangkar (persegi). Sebuah persegi memiliki berapa sisi yang sama panjang dan berapa kali robot harus berbelok?",
      },
      {
        tier: 2,
        title: "Petunjuk Konsep: Simetri Geometris dalam FOR 💡",
        badge: "Tingkat 2: Simetri Pola",
        content:
          "Karena persegi memiliki 4 sisi yang identik, tindakan [menelusuri satu sisi -> ambil baterai -> belok] diulang persis 4 kali menggunakan satu wadah FOR repeat 4.",
      },
      {
        tier: 3,
        title: "Saran Kontekstual Balok 🔍",
        badge: "Tingkat 3: Analisis Balok",
        content:
          "Hitung panjang satu sisi persegi (misal: 2 langkah maju). Di akhir setiap sisi, robot mengambil baterai dan berbelok KANAN agar menghadap ke sisi berikutnya.",
      },
      {
        tier: 4,
        title: "Contoh Pola Serupa 🧩",
        badge: "Tingkat 4: Pola Analogi",
        content:
          "Mengitari lapangan 4 sudut:\nfor (int sisi = 0; sisi < 4; sisi++) {\n  lariMaju(2);\n  minum();\n  belokKanan();\n}",
        exampleSnippet: "for (int i = 0; i < 4; i++) {\n  move(); move();\n  collect(); turnRight();\n}",
      },
      {
        tier: 5,
        title: "Penjelasan Struktur Solusi 🎯",
        badge: "Tingkat 5: Struktur Solusi",
        content:
          "Gunakan balok FOR (repeat 4). Masukkan: MAJU -> MAJU -> AMBIL BATERAI -> BELOK KANAN.",
        codeIllustration:
          "for (int i = 0; i < 4; i++) {\n    move();\n    move();\n    collect();\n    turnRight();\n}",
      },
    ],

    8: [
      {
        tier: 1,
        title: "Pertanyaan Pemandu 🤔",
        badge: "Tingkat 1: Penalaran Mandiri",
        content:
          "Tantangan Grand Master: Ada lintasan berulang teratur dan ada lintasan panjang menuju dinding. Bagaimana menggabungkan kekuatan loop FOR dan loop WHILE dalam satu misi?",
      },
      {
        tier: 2,
        title: "Petunjuk Konsep: Kombinasi FOR dan WHILE 💡",
        badge: "Tingkat 2: Master Algoritma",
        content:
          "Level 8 mewajibkan penggunaan KEDUA jenis perulangan: gunakan loop FOR untuk bagian yang jumlah langkahnya sudah pasti, dan gunakan loop WHILE untuk bagian yang panjang jalurnya ditentukan oleh sensor dinding.",
      },
      {
        tier: 3,
        title: "Saran Kontekstual Balok 🔍",
        badge: "Tingkat 3: Analisis Balok",
        content:
          "Bagian pertama: loop FOR repeat 3 kali untuk mengumpulkan 3 baterai pertama. Bagian kedua: putar haluan dan gunakan loop WHILE (path_clear) untuk melaju kencang ke baterai terakhir.",
      },
      {
        tier: 4,
        title: "Contoh Pola Serupa 🧩",
        badge: "Tingkat 4: Pola Analogi",
        content:
          "// Tahap 1: Pengulangan langkah terhitung\nfor (int i = 0; i < 3; i++) { ... }\n// Tahap 2: Luncurkan robot dengan sensor jalan\nwhile (pathClear()) { ... }",
      },
      {
        tier: 5,
        title: "Penjelasan Struktur Solusi 🎯",
        badge: "Tingkat 5: Struktur Solusi",
        content:
          "1. Loop FOR (repeat 3): MAJU -> AMBIL BATERAI\n2. BELOK KANAN\n3. Loop WHILE (path_clear): MAJU\n4. AMBIL BATERAI di titik akhir.",
        codeIllustration:
          "for (int i = 0; i < 3; i++) {\n    move();\n    collect();\n}\nturnRight();\nwhile (pathClear()) {\n    move();\n}\ncollect();",
      },
    ],
  };

  if (hints[level.id]) {
    return hints[level.id];
  }

  // Fallback for custom or extended levels
  return [
    {
      tier: 1,
      title: "Pertanyaan Pemandu 🤔",
      badge: "Tingkat 1",
      content: level.hints.hint1 || "Perhatikan letak baterai dan susun langkah robot dengan teliti.",
    },
    {
      tier: 2,
      title: "Petunjuk Konseptual 💡",
      badge: "Tingkat 2",
      content:
        level.hints.hint2 ||
        "Gunakan perulangan untuk menghemat penulisan perintah yang sama berulang kali.",
    },
    {
      tier: 3,
      title: "Saran Balok 🔍",
      badge: "Tingkat 3",
      content:
        level.hints.hint3 ||
        "Tarik balok perulangan yang sesuai dan masukkan balok aksi di dalamnya.",
    },
    {
      tier: 4,
      title: "Contoh Pola Serupa 🧩",
      badge: "Tingkat 4",
      content: "Perhatikan pola gerakan: maju lalu ambil baterai adalah pasangan instruksi umum.",
    },
    {
      tier: 5,
      title: "Struktur Solusi 🎯",
      badge: "Tingkat 5",
      content: "Pastikan seluruh baterai sasaran terambil dan robot tidak menabrak rintangan.",
    },
  ];
}
