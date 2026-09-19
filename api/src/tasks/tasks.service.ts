import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTaskDto, UpdateTaskDto } from './dto/task.dto.js';

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  column: { select: { id: true, name: true } },
  board: { select: { id: true, name: true } },
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerId: string, from?: string, to?: string) {
    return this.prisma.task.findMany({
      where: {
        board: { ownerId },
        ...(from || to
          ? {
              OR: [
                {
                  dueDate: {
                    gte: from ? new Date(from) : undefined,
                    lte: to ? new Date(to) : undefined,
                  },
                },
                {
                  startDate: {
                    gte: from ? new Date(from) : undefined,
                    lte: to ? new Date(to) : undefined,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ startDate: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
      include: taskInclude,
    });
  }

  async create(ownerId: string, boardId: string, dto: CreateTaskDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== ownerId) throw new ForbiddenException();

    const columnId = dto.columnId ?? board.columns[0]?.id;
    if (!columnId) throw new NotFoundException('Board has no columns');
    const column = board.columns.find((item) => item.id === columnId);
    if (!column) throw new NotFoundException('Column not found');

    const last = await this.prisma.task.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    return this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() ?? '',
        priority: dto.priority ?? 'MEDIUM',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        order: (last._max.order ?? -1) + 1,
        boardId,
        columnId,
        assigneeId: ownerId,
      },
      include: taskInclude,
    });
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { board: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.board.ownerId !== ownerId) throw new ForbiddenException();

    if (dto.columnId && dto.columnId !== task.columnId) {
      const column = await this.prisma.column.findUnique({
        where: { id: dto.columnId },
      });
      if (!column || column.boardId !== task.boardId) {
        throw new NotFoundException('Column not found on this board');
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
        ...(dto.columnId ? { columnId: dto.columnId } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
      include: taskInclude,
    });
  }

  async move(
    ownerId: string,
    id: string,
    columnId: string,
    orderedTaskIds: string[],
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { board: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.board.ownerId !== ownerId) throw new ForbiddenException();

    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
    });
    if (!column || column.boardId !== task.boardId) {
      throw new NotFoundException('Column not found on this board');
    }

    await this.prisma.$transaction(
      orderedTaskIds.map((taskId, order) =>
        this.prisma.task.update({
          where: { id: taskId },
          data: { columnId, order },
        }),
      ),
    );

    return this.update(ownerId, id, { columnId });
  }

  async remove(ownerId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { board: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.board.ownerId !== ownerId) throw new ForbiddenException();
    await this.prisma.task.delete({ where: { id } });
    return { ok: true };
  }
}
