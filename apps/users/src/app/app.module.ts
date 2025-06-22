import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';


@Module({
  controllers: [],
  imports: [UserModule],
})
export class AppModule {}