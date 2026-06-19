import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../../common/guards/auth.guard'
import { PendingFieldsGuard } from '../../common/guards/pending-fields.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthUser } from '../../common/auth/auth.types'
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe'
import { GamesService } from './games.service'
import {
  CreateGameInput,
  GameIconPresignInput,
  GameIconPresignResponse,
  GameView,
  UpdateGameInput,
  createGameSchema,
  gameIconPresignSchema,
  updateGameSchema,
} from './games.dto'

@ApiTags('games')
@Controller('games')
@UseGuards(AuthGuard, PendingFieldsGuard)
@ApiBearerAuth()
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get()
  list(): Promise<GameView[]> {
    return this.games.list()
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(createGameSchema)) dto: CreateGameInput): Promise<GameView> {
    return this.games.create(user, dto)
  }

  @Post('icon/presign')
  presignIcon(@CurrentUser() user: AuthUser, @Body(new ZodValidationPipe(gameIconPresignSchema)) dto: GameIconPresignInput): Promise<GameIconPresignResponse> {
    return this.games.presignIcon(user, dto.contentType)
  }

  @Patch(':gameId')
  update(@CurrentUser() user: AuthUser, @Param('gameId') gameId: string, @Body(new ZodValidationPipe(updateGameSchema)) dto: UpdateGameInput): Promise<GameView> {
    return this.games.update(user, gameId, dto)
  }

  @Delete(':gameId')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('gameId') gameId: string): Promise<void> {
    return this.games.remove(user, gameId)
  }
}
