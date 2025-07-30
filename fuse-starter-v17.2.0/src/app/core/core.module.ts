import { NgModule, Optional, SkipSelf, APP_INITIALIZER } from '@angular/core';
import { AuthModule } from 'app/core/auth/auth.module';
import { IconsModule } from 'app/core/icons/icons.module';
import { TranslocoCoreModule } from 'app/core/transloco/transloco.module';
import { UserLoaderService } from './services/user-loader.service';

@NgModule({
    imports: [
        AuthModule,
        IconsModule,
        TranslocoCoreModule
    ],
    providers: [
        UserLoaderService,
        {
            provide: APP_INITIALIZER,
            useFactory: (userLoaderService: UserLoaderService) => () => userLoaderService.loadUserIfAuthenticated(),
            deps: [UserLoaderService],
            multi: true
        }
    ]
})
export class CoreModule
{
    /**
     * Constructor
     */
    constructor(
        @Optional() @SkipSelf() parentModule?: CoreModule
    )
    {
        // Do not allow multiple injections
        if ( parentModule )
        {
            throw new Error('CoreModule has already been loaded. Import this module in the AppModule only.');
        }
    }
}
