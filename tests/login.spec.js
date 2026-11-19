import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL;
const EMAIL_VALID = process.env.EMAIL_VALID;
const SANDI_VALID = process.env.SANDI_VALID;
const EMAIL_BELUM_ACC = process.env.EMAIL_BELUM_ACC;
const SANDI_BELUM_ACC = process.env.SANDI_BELUM_ACC;
const EMAIL_UJI_BLOKIR = process.env.EMAIL_UJI_BLOKIR;
const SANDI_UJI_BLOKIR = process.env.SANDI_UJI_BLOKIR;

async function login(page, email, sandi) {
  await page.getByPlaceholder("contoh: nama@email.com").fill(email);
  await page.getByPlaceholder("Masukkan password").fill(sandi);

  const responsePromise = page.waitForResponse("**/api/login");
  await page.getByRole("button", { name: "Masuk" }).click();
  return await responsePromise;
}

async function cekLoginGagal(page) {
  await expect(page).toHaveURL(BASE_URL);
  await expect(page.getByText("Email atau password salah.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/sql|syntax|sqlstate/i);
}

async function cekLoginBerhasil(page) {
  await expect(page).toHaveURL(`${BASE_URL}dashboard`);
  await expect(page.locator("#btn-user-menu")).toBeVisible();
}

function pantauApiLogin(page) {
  const status = { dipanggil: false };
  page.on("request", (req) => {
    if (req.url().includes("/api/login")) status.dipanggil = true;
  });
  return status;
}

test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
});

test.describe("Login Page", () => {
  test("Field Email", async ({ page }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByPlaceholder("contoh: nama@email.com")).toBeVisible();
  });

  test("Field Kata Sandi", async ({ page }) => {
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByPlaceholder("Masukkan password")).toBeVisible();
  });

  test("Tombol Login dan Link", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Lupa password?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Daftar Sekarang" }),
    ).toBeVisible();
  });

  test("Link Daftar Sekarang", async ({ page }) => {
    await page.getByRole("link", { name: "Daftar Sekarang" }).click();
    await expect(page).toHaveURL(`${BASE_URL}register`);
  });

  test("Link Lupa Kata Sandi", async ({ page }) => {
    await page.getByRole("link", { name: "Lupa password?" }).click();
    await expect(page).toHaveURL(`${BASE_URL}lupa-password`);
  });

  test("Ikon mata untuk tampil/sembunyikan kata sandi", async ({ page }) => {
    const inputSandi = page.getByPlaceholder("Masukkan password");
    const tombolMata = page.locator("#login-toggle-password");

    await inputSandi.fill(SANDI_VALID);

    //Awalnya tersembunyi
    await expect(inputSandi).toHaveAttribute("type", "password");
    await expect(tombolMata).toHaveAttribute(
      "aria-label",
      "Tampilkan password",
    );

    //Klik, kata sandi terlihat
    await tombolMata.click();
    await expect(inputSandi).toHaveAttribute("type", "text");
    await expect(tombolMata).toHaveAttribute(
      "aria-label",
      "Sembunyikan password",
    );
    await expect(inputSandi).toHaveValue(SANDI_VALID);

    // Klik lagi, tersembunyi kembali
    await tombolMata.click();
    await expect(inputSandi).toHaveAttribute("type", "password");
  });
  test("Email kapital di awal", async ({ page }) => {
    const emailKapital =
      EMAIL_VALID.charAt(0).toUpperCase() + EMAIL_VALID.slice(1);

    const response = await login(page, emailKapital, SANDI_VALID);
    expect(response.status()).toBe(200);
    await cekLoginBerhasil(page);
  });

  test("Login Berhasil", async ({ page }) => {
    const response = await login(page, EMAIL_VALID, SANDI_VALID);
    expect(response.status()).toBe(200);

    //bukti udah ke dashboard
    await cekLoginBerhasil(page);
  });
  test("Jaringan Lambat", async ({ page }) => {
    await page.route("**/api/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });
    await page.getByPlaceholder("contoh: nama@email.com").fill(EMAIL_VALID);
    await page.getByPlaceholder("Masukkan password").fill(SANDI_VALID);

    const mulai = Date.now();
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(
      page.getByRole("button", { name: /Masuk|Memproses/ }),
    ).toBeDisabled();
    await expect(page).toHaveURL(`${BASE_URL}dashboard`, { timeout: 10000 });
    const durasi = Date.now() - mulai;
    expect(durasi).toBeGreaterThanOrEqual(3000);
    await expect(page.locator("#btn-user-menu")).toBeVisible();
  });
  test("Refresh saat login sedang loading", async ({ page }) => {
    await page.route("**/api/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });
    await page.getByPlaceholder("contoh: nama@email.com").fill(EMAIL_VALID);
    await page.getByPlaceholder("Masukkan password").fill(SANDI_VALID);
    await page.getByRole("button", { name: "Masuk" }).click();
    //bukti reload terjadi saat loading
    await expect(
      page.getByRole("button", { name: /Masuk|Memproses/ }),
    ).toBeDisabled();

    await page.reload();
    //tetap di login
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.getByRole("button", { name: "Masuk" })).toBeEnabled();

    await page.goto(`${BASE_URL}dashboard`);
    await expect(page).toHaveURL(BASE_URL);
  });
});

test.describe("Login Gagal", () => {
  test("Email Salah", async ({ page }) => {
    const response = await login(
      page,
      "emailjelassalah@gmail.com",
      SANDI_VALID,
    );

    expect(response.status()).toBe(401);
    await cekLoginGagal(page);
  });

  test("Password Salah", async ({ page }) => {
    const response = await login(page, EMAIL_VALID, SANDI_VALID.toLowerCase());

    expect(response.status()).toBe(401);
    await cekLoginGagal(page);
  });

  test("Password 7 Karakter", async ({ page }) => {
    const response = await login(page, EMAIL_VALID, "qwEr3!k");
    expect(response.status()).toBe(401);
    await cekLoginGagal(page);
  });

  test("Email dan Password Kosong", async ({ page }) => {
    const api = pantauApiLogin(page);
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByText("Email wajib diisi.")).toBeVisible();
    await expect(page.getByText("Password wajib diisi.")).toBeVisible();
    await expect(page).toHaveURL(BASE_URL);
    expect(api.dipanggil).toBe(false);
  });
  test("Akun belum di ACC superadmin", async ({ page }) => {
    const response = await login(page, EMAIL_BELUM_ACC, SANDI_BELUM_ACC);
    expect(response.status()).toBe(403);
    await expect(page.locator(".login-error")).toContainText(
      "menunggu persetujuan",
    );
    await expect(page.getByRole("button", { name: "Keluar" })).toHaveCount(0);
    await expect(page).toHaveURL(BASE_URL);
  });

  test.describe("Format Email tidak valid", () => {
    const notValidFormatEmail = [
      "didil@",
      "12345",
      "@gmail.com",
      "emailformatsalah",
    ];

    for (const email of notValidFormatEmail) {
      test(`Email: ${email}`, async ({ page }) => {
        const inputEmail = page.getByPlaceholder("contoh: nama@email.com");
        const api = pantauApiLogin(page);

        await inputEmail.fill(email);
        await page.getByPlaceholder("Masukkan password").fill(SANDI_VALID);
        await page.getByRole("button", { name: "Masuk" }).click();
        await expect(page.locator(".field-error")).toContainText(
          "Format email tidak valid",
        );

        await expect(page).toHaveURL(BASE_URL);
        expect(api.dipanggil).toBe(false);
      });
    }
  });
});

test.describe("SQL Injection pada Email", () => {
  const payloads = [
    "'or'1'='1@mail.com",
    "admin'--@mail.com",
    "'or1=1--@mail.com",
    "kasir'or'1'='1@mail.com",
  ];
  for (const payload of payloads) {
    test(`Email: ${payload}`, async ({ page }) => {
      const response = await login(page, payload, SANDI_VALID);

      expect(response.status()).toBe(401);
      await cekLoginGagal(page);
    });
  }
});

test.describe("SQL Injection pada Kata Sandi", () => {
  const payloads = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "superadmin' --",
    "' OR '1'='1' /*",
    "'; DROP TABLE users; --",
  ];

  for (const payload of payloads) {
    test(`Kata Sandi: ${payload}`, async ({ page }) => {
      const response = await login(page, EMAIL_VALID, payload);

      expect(response.status()).toBe(401);

      await cekLoginGagal(page);
    });
  }
});
test.describe("Blokir akun", () => {
  test.describe.configure({ mode: "serial" });

  const BATAS = 5;

  test("LG-020: percobaan ke-5 memicu blokir", async ({ page }) => {
    // percobaan 1 sampai BATAS-1: ditolak biasa
    for (let i = 1; i < BATAS; i++) {
      const response = await login(page, EMAIL_UJI_BLOKIR, "SandiSalah-999");
      expect(response.status(), `percobaan ke-${i}`).toBe(401);
    }

    // percobaan ke-5: terblokir
    const responseBlokir = await login(
      page,
      EMAIL_UJI_BLOKIR,
      "SandiSalah-999",
    );
    expect(responseBlokir.status()).toBe(429);

    await expect(page.locator(".login-error")).toContainText(
      /Terlalu banyak percobaan login/,
    );
    await expect(
      page.getByRole("button", { name: /Coba lagi dalam/ }),
    ).toBeDisabled();
    await expect(page).toHaveURL(BASE_URL);
  });

  test("login benar saat akun masih terblokir", async ({ page }) => {
    // password BENAR, tapi akun masih terblokir dari tes sebelumnya
    const response = await login(page, EMAIL_UJI_BLOKIR, SANDI_UJI_BLOKIR);
    expect(response.status()).toBe(429); // cek di tab Jaringan, sesuaikan kalau beda

    await expect(page.locator(".login-error")).toContainText(
      /Terlalu banyak percobaan login/,
    );

    // tetap tidak masuk
    await expect(page).toHaveURL(BASE_URL);
    await expect(page.locator("#btn-user-menu")).toHaveCount(0);
  });
});
