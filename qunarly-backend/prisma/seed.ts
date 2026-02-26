import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import { importAdminUnits, resolveAdminUnitsFile } from './import-admin-units';

const prisma = new PrismaClient();

const regionsData: Array<{ name: string; districts: string[] }> = [
  {
    name: 'Абай облысы',
    districts: [
      'Абай ауданы',
      'Ақсуат ауданы',
      'Аягөз ауданы',
      'Бесқарағай ауданы',
      'Бородулиха ауданы',
      'Жарма ауданы',
      'Көкпекті ауданы',
      'Мақаншы ауданы',
      'Үржар ауданы',
      'Семей',
      'Курчатов',
    ],
  },
  {
    name: 'Ақмола облысы',
    districts: [
      'Ақкөл ауданы',
      'Аршалы ауданы',
      'Астрахан ауданы',
      'Атбасар ауданы',
      'Бурабай ауданы',
      'Бұланды ауданы',
      'Егіндікөл ауданы',
      'Ерейментау ауданы',
      'Есіл ауданы',
      'Жақсы ауданы',
      'Жарқайың ауданы',
      'Зеренді ауданы',
      'Қорғалжын ауданы',
      'Сандықтау ауданы',
      'Целиноград ауданы',
      'Шортанды ауданы',
      'Көкшетау',
      'Степногорск',
      'Қосшы',
    ],
  },
  {
    name: 'Ақтөбе облысы',
    districts: [
      'Ақтөбе ауданы',
      'Алға ауданы',
      'Әйтеке би ауданы',
      'Байғанин ауданы',
      'Қарғалы ауданы',
      'Хромтау ауданы',
      'Ырғыз ауданы',
      'Мұғалжар ауданы',
      'Ойыл ауданы',
      'Темір ауданы',
      'Шалқар ауданы',
      'Ақтөбе',
    ],
  },
  {
    name: 'Алматы облысы',
    districts: [
      'Балқаш ауданы',
      'Еңбекшіқазақ ауданы',
      'Жамбыл ауданы',
      'Іле ауданы',
      'Қарасай ауданы',
      'Кеген ауданы',
      'Райымбек ауданы',
      'Талғар ауданы',
      'Ұйғыр ауданы',
      'Қонаев',
      'Алатау',
    ],
  },
  {
    name: 'Атырау облысы',
    districts: [
      'Индер ауданы',
      'Исатай ауданы',
      'Құрманғазы ауданы',
      'Мақат ауданы',
      'Махамбет ауданы',
      'Қызылқоға ауданы',
      'Атырау',
    ],
  },
  {
    name: 'Шығыс Қазақстан облысы',
    districts: [
      'Алтай ауданы',
      'Глубокое ауданы',
      'Катонқарағай ауданы',
      'Марқакөл ауданы',
      'Самар ауданы',
      'Тарбағатай ауданы',
      'Ұлан ауданы',
      'Шемонаиха ауданы',
      'Өскемен',
      'Риддер',
    ],
  },
  {
    name: 'Жамбыл облысы',
    districts: [
      'Байзақ ауданы',
      'Жамбыл ауданы',
      'Жуалы ауданы',
      'Қордай ауданы',
      'Меркі ауданы',
      'Мойынқұм ауданы',
      'Сарысу ауданы',
      'Талас ауданы',
      'Шу ауданы',
      'Тараз',
    ],
  },
  {
    name: 'Жетісу облысы',
    districts: [
      'Ақсу ауданы',
      'Алакөл ауданы',
      'Ескелді ауданы',
      'Қаратал ауданы',
      'Кербұлақ ауданы',
      'Көксу ауданы',
      'Панфилов ауданы',
      'Талдықорған',
    ],
  },
  {
    name: 'Батыс Қазақстан облысы',
    districts: [
      'Ақжайық ауданы',
      'Бәйтерек ауданы',
      'Бөрлі ауданы',
      'Бөкей ордасы ауданы',
      'Жаңақала ауданы',
      'Жәнібек ауданы',
      'Қазталов ауданы',
      'Қаратөбе ауданы',
      'Сырым ауданы',
      'Теректі ауданы',
      'Шыңғырлау ауданы',
      'Орал',
    ],
  },
  {
    name: 'Қарағанды облысы',
    districts: [
      'Абай ауданы',
      'Ақтоғай ауданы',
      'Бұқар жырау ауданы',
      'Қарқаралы ауданы',
      'Нұра ауданы',
      'Осакаров ауданы',
      'Шет ауданы',
      'Қарағанды',
      'Теміртау',
      'Балқаш',
      'Саран',
    ],
  },
  {
    name: 'Қостанай облысы',
    districts: [
      'Алтынсарин ауданы',
      'Амангелді ауданы',
      'Әулиекөл ауданы',
      'Денисов ауданы',
      'Жангелдин ауданы',
      'Қамысты ауданы',
      'Қарабалық ауданы',
      'Қостанай ауданы',
      'Меңдіқара ауданы',
      'Науырзым ауданы',
      'Сарыкөл ауданы',
      'Таран ауданы',
      'Ұзынкөл ауданы',
      'Федоров ауданы',
      'Қостанай',
      'Рудный',
      'Лисаков',
    ],
  },
  {
    name: 'Қызылорда облысы',
    districts: [
      'Арал ауданы',
      'Жалағаш ауданы',
      'Қазалы ауданы',
      'Қармақшы ауданы',
      'Сырдария ауданы',
      'Шиелі ауданы',
      'Қызылорда',
    ],
  },
  {
    name: 'Маңғыстау облысы',
    districts: [
      'Бейнеу ауданы',
      'Қарақия ауданы',
      'Маңғыстау ауданы',
      'Мұнайлы ауданы',
      'Түпқараған ауданы',
      'Ақтау',
      'Жаңаөзен',
    ],
  },
  {
    name: 'Павлодар облысы',
    districts: [
      'Аққулы ауданы',
      'Ақтоғай ауданы',
      'Баянауыл ауданы',
      'Ертіс ауданы',
      'Железин ауданы',
      'Май ауданы',
      'Тереңкөл ауданы',
      'Успен ауданы',
      'Шарбақты ауданы',
      'Павлодар',
      'Екібастұз',
      'Ақсу',
    ],
  },
  {
    name: 'Солтүстік Қазақстан облысы',
    districts: [
      'Айыртау ауданы',
      'Ақжар ауданы',
      'Ғабит Мүсірепов ауданы',
      'Есіл ауданы',
      'Жамбыл ауданы',
      'Мамлют ауданы',
      'Қызылжар ауданы',
      'Тайынша ауданы',
      'Тимирязев ауданы',
      'Уәлиханов ауданы',
      'Шал ақын ауданы',
      'Петропавл',
    ],
  },
  {
    name: 'Түркістан облысы',
    districts: [
      'Бәйдібек ауданы',
      'Келес ауданы',
      'Қазығұрт ауданы',
      'Мақтаарал ауданы',
      'Ордабасы ауданы',
      'Отырар ауданы',
      'Сайрам ауданы',
      'Сарыағаш ауданы',
      'Созақ ауданы',
      'Төлеби ауданы',
      'Түлкібас ауданы',
      'Шардара ауданы',
      'Жетісай ауданы',
      'Түркістан',
    ],
  },
  {
    name: 'Ұлытау облысы',
    districts: ['Жаңаарқа ауданы', 'Ұлытау ауданы', 'Жезқазған', 'Сәтбаев', 'Қаражал'],
  },
  {
    name: 'Астана',
    districts: ['Астана'],
  },
  {
    name: 'Алматы',
    districts: ['Алматы'],
  },
  {
    name: 'Шымкент',
    districts: ['Шымкент'],
  },
];

async function upsertRegion(name: string, parentId: string | null) {
  const existing = await prisma.region.findFirst({
    where: { name, parentId },
  });
  if (existing) {
    return existing;
  }
  return prisma.region.create({
    data: { name, parentId },
  });
}

async function upsertDistrict(name: string, regionId: string) {
  const existing = await prisma.district.findFirst({
    where: { name, regionId },
  });
  if (existing) {
    return existing;
  }
  return prisma.district.create({
    data: { name, regionId },
  });
}

async function main() {
  const baseDir = path.resolve(process.cwd());
  const adminUnitsFile = resolveAdminUnitsFile(baseDir);
  if (adminUnitsFile) {
    try {
      await importAdminUnits(prisma, adminUnitsFile);
    } catch (e: any) {
      console.warn('Import from file failed, falling back to regionsData:', e.message);
      for (const region of regionsData) {
        const regionRow = await upsertRegion(region.name, null);
        for (const districtName of region.districts) {
          await upsertRegion(districtName, regionRow.id);
          await upsertDistrict(districtName, regionRow.id);
        }
      }
    }
  } else {
    for (const region of regionsData) {
      const regionRow = await upsertRegion(region.name, null);
      for (const districtName of region.districts) {
        // Create district as a child region (legacy/fallback)
        await upsertRegion(districtName, regionRow.id);
        // Create district in the District table (new canonical)
        await upsertDistrict(districtName, regionRow.id);
      }
    }
  }

  const adminEmail = 'admin@qunarly.kz';
  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
