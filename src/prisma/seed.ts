import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Role 데이터 생성
  await prisma.role.createMany({
    data: [
      { id: 1, name: '프로그래머' },
      { id: 2, name: '아티스트' },
      { id: 3, name: '디자이너' },
    ],
    skipDuplicates: true, // 중복 생성 방지
  });
  // Status 데이터 업데이트
  const statuses = [
    { id: 1, name: '둘러보는 중' },
    { id: 2, name: '외주/프로젝트 구하는 중' },
    { id: 3, name: '구인하는 중' },
    { id: 4, name: '작업 중' },
  ];

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { id: status.id }, // ID 기준으로 존재 여부 확인
      update: { name: status.name }, // 이미 존재하면 업데이트
      create: { id: status.id, name: status.name }, // 존재하지 않으면 생성
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
