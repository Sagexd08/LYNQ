import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        try {
            return await this.prisma.user.create({
                data: {
                    phone: createUserDto.phone,
                    reputation: {
                        create: {
                            score: 50,
                        },
                    },
                },
                include: {
                    reputation: true,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new ConflictException('User with this phone already exists');
            }
            throw error;
        }
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                reputation: true,
                loans: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }
}
