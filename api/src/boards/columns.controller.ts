import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BoardsService } from './boards.service.js';
import { UpdateColumnDto } from './dto/column.dto.js';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator.js';

@Controller('columns')
@UseGuards(AuthGuard('jwt'))
export class ColumnsController {
  constructor(private readonly boards: BoardsService) {}

  @Patch(':columnId')
  updateColumn(
    @CurrentUser() user: AuthUser,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.boards.updateColumn(user.userId, columnId, dto.name);
  }

  @Delete(':columnId')
  removeColumn(
    @CurrentUser() user: AuthUser,
    @Param('columnId') columnId: string,
  ) {
    return this.boards.removeColumn(user.userId, columnId);
  }
}
