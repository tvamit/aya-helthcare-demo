import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { BedsService } from './beds.service';
import { CreateBedDto } from './dto/create-bed.dto';
import { UpdateBedDto } from './dto/update-bed.dto';

@ApiTags('beds')
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsService: BedsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bed' })
  @ApiResponse({ status: 201, description: 'Bed created successfully' })
  create(@Body() createBedDto: CreateBedDto) {
    return this.bedsService.create(createBedDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all beds with optional filters' })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  @ApiQuery({ name: 'ward', required: false, type: String })
  async findAll(
    @Query('available') available?: string,
    @Query('ward') ward?: string,
  ) {
    const filters: any = {};
    if (available !== undefined) {
      filters.available = available === 'true';
    }
    if (ward) {
      filters.ward = ward;
    }

    const beds = await this.bedsService.findAll(filters);
    return {
      success: true,
      count: beds.length,
      data: beds,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get bed availability statistics' })
  async getStats() {
    const total = (await this.bedsService.findAll({})).length;
    const available = await this.bedsService.getAvailableCount();
    const occupied = total - available;

    return {
      success: true,
      stats: {
        total,
        available,
        occupied,
        occupancyRate: total > 0 ? ((occupied / total) * 100).toFixed(2) : 0,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a bed by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bedsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bed' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateBedDto: UpdateBedDto) {
    return this.bedsService.update(id, updateBedDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bed' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.bedsService.remove(id);
    return { success: true, message: 'Bed deleted successfully' };
  }
}
