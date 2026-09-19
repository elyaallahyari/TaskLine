import { PrismaClient, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('demo1234', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@taskline.app' },
    update: {},
    create: {
      email: 'demo@taskline.app',
      name: 'Elya',
      password,
    },
  });

  await prisma.board.deleteMany({ where: { ownerId: user.id } });

  const board = await prisma.board.create({
    data: {
      name: 'Product launch',
      description: 'Ship TaskLine v1 — boards, calendar, and timeline.',
      ownerId: user.id,
    },
  });

  const [todo, doing, review, done] = await Promise.all([
    prisma.column.create({
      data: { name: 'To do', order: 0, boardId: board.id },
    }),
    prisma.column.create({
      data: { name: 'In progress', order: 1, boardId: board.id },
    }),
    prisma.column.create({
      data: { name: 'Review', order: 2, boardId: board.id },
    }),
    prisma.column.create({
      data: { name: 'Done', order: 3, boardId: board.id },
    }),
  ]);

  const today = new Date();
  const day = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    d.setHours(9, 0, 0, 0);
    return d;
  };

  const tasks: Array<{
    title: string;
    description: string;
    priority: Priority;
    columnId: string;
    order: number;
    startDate: Date;
    dueDate: Date;
  }> = [
    {
      title: 'Design landing page',
      description: 'Minimal hero, product preview, and a clear get-started path.',
      priority: 'HIGH',
      columnId: done.id,
      order: 0,
      startDate: day(-10),
      dueDate: day(-6),
    },
    {
      title: 'Auth and workspace shell',
      description: 'Email login, dashboard layout, and protected routes.',
      priority: 'HIGH',
      columnId: done.id,
      order: 1,
      startDate: day(-8),
      dueDate: day(-3),
    },
    {
      title: 'Kanban board with drag and drop',
      description: 'Columns, cards, and reorder with dnd kit.',
      priority: 'URGENT',
      columnId: doing.id,
      order: 0,
      startDate: day(-2),
      dueDate: day(2),
    },
    {
      title: 'Calendar view',
      description: 'Month grid with tasks placed on due dates.',
      priority: 'MEDIUM',
      columnId: doing.id,
      order: 1,
      startDate: day(-1),
      dueDate: day(4),
    },
    {
      title: 'Timeline view',
      description: 'Real date ranges rendered as a work timeline.',
      priority: 'HIGH',
      columnId: todo.id,
      order: 0,
      startDate: day(1),
      dueDate: day(8),
    },
    {
      title: 'AI agents (next)',
      description: 'Chat with agents from any board, task, or timeline row.',
      priority: 'LOW',
      columnId: todo.id,
      order: 1,
      startDate: day(10),
      dueDate: day(21),
    },
    {
      title: 'Polish empty states',
      description: 'Keep the UI quiet when there is nothing to show.',
      priority: 'LOW',
      columnId: review.id,
      order: 0,
      startDate: day(-3),
      dueDate: day(1),
    },
  ];

  await prisma.task.createMany({
    data: tasks.map((task) => ({
      ...task,
      boardId: board.id,
      assigneeId: user.id,
    })),
  });

  await prisma.board.create({
    data: {
      name: 'Personal',
      description: 'Quiet list for everything else.',
      ownerId: user.id,
      columns: {
        create: [
          { name: 'Later', order: 0 },
          { name: 'This week', order: 1 },
          { name: 'Done', order: 2 },
        ],
      },
    },
  });

  console.log('Seeded demo user demo@taskline.app / demo1234');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
