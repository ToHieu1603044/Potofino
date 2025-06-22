import { Controller } from '@nestjs/common';
import { Ctx, GrpcMethod, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { LoginDto } from './dto/login.dto';
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @MessagePattern('user.create')
  async handleUserCreate(@Payload() userData: any, @Ctx() context: KafkaContext) {
    console.log('🔥 Received Kafka message on user.create:', userData);
    const user = await this.userService.createUser(userData);
    return user;
  }

@GrpcMethod('UserService', 'FindUserByEmail')
  async findUserByEmail(data: { email: string }) {
    return this.userService.findUserByEmail({ email: data.email });
  }
}
