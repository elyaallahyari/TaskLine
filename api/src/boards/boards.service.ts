import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateBoardDto } from './dto/create-board.dto.js';
import type { UpdateBoardDto } from './dto/update-board.dto.js';
import type { CreateColumnDto } from './dto/column.dto.js';

const boardInclude = {
  columns: {
    orderBy: { order: 'asc' as const },
    include: {
      tasks: {
        orderBy: { order: 'asc' as const },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      },
    },
  },
};

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.board.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { tasks: true, columns: true } },
      },
    });
  }

  async get(ownerId: string, id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: boardInclude,
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId !== ownerId) throw new ForbiddenException();
    return board;
  }

  create(ownerId: string, dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() ?? '',
        ownerId,
        columns: {
          create: [
            { name: 'To do', order: 0 },
            { name: 'In progress', order: 1 },
            { name: 'Done', order: 2 },
          ],
        },
      },
      include: boardInclude,
    });
  }

  async update(ownerId: string, id: string, dto: UpdateBoardDto) {
    await this.get(ownerId, id);
    return this.prisma.board.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
      },
      include: boardInclude,
    });
  }

  async remove(ownerId: string, id: string) {
    await this.get(ownerId, id);
    await this.prisma.board.delete({ where: { id } });
    return { ok: true };
  }

  async addColumn(ownerId: string, boardId: string, dto: CreateColumnDto) {
    await this.get(ownerId, boardId);
    const last = await this.prisma.column.aggregate({
      where: { boardId },
      _max: { order: true },
    });
    return this.prisma.column.create({
      data: {
        name: dto.name.trim(),
        order: (last._max.order ?? -1) + 1,
        boardId,
      },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async updateColumn(ownerId: string, columnId: string, name: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column) throw new NotFoundException('Column not found');
    if (column.board.ownerId !== ownerId) throw new ForbiddenException();
    return this.prisma.column.update({
      where: { id: columnId },
      data: { name: name.trim() },
    });
  }

  async removeColumn(ownerId: string, columnId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column) throw new NotFoundException('Column not found');
    if (column.board.ownerId !== ownerId) throw new ForbiddenException();
    await this.prisma.column.delete({ where: { id: columnId } });
    return { ok: true };
  }

  async reorderColumns(ownerId: string, boardId: string, columnIds: string[]) {
    const board = await this.get(ownerId, boardId);
    const existing = new Set(board.columns.map((column) => column.id));
    if (
      columnIds.length !== existing.size ||
      columnIds.some((id) => !existing.has(id))
    ) {
      throw new NotFoundException('Column list does not match this board');
    }
    await this.prisma.$transaction(
      columnIds.map((id, order) =>
        this.prisma.column.update({ where: { id }, data: { order } }),
      ),
    );
    return this.get(ownerId, boardId);
  }
}
