import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller.js';
import { ColumnsController } from './columns.controller.js';
import { BoardsService } from './boards.service.js';

@Module({
  controllers: [BoardsController, ColumnsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
