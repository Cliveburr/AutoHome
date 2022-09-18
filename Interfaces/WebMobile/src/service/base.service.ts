import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LoadingController, ToastController } from "@ionic/angular";

@Injectable()
export class BaseService {

    public constructor(
        private loadingController: LoadingController,
        private toastController: ToastController
    ) {

    }

    private getFriendlyErrorMessage(err: any): string {
        if (err instanceof HttpErrorResponse) {
            return err.message;
        }
        return err.toString();
    }

    public withLoading<T>(promise: Promise<T>): Promise<T> {
        return new Promise<T>(async (e, r) => {
            const loading = await this.loadingController.create();
            await loading.present();
            promise
                .then(async data => {
                    e(data);
                    await loading.dismiss();
                })
                .catch(async err => {
                    await loading.dismiss();
                    const toast = await this.toastController.create({
                        message: this.getFriendlyErrorMessage(err),
                        color: "danger",
                        buttons: [
                            {
                              text: 'Ok',
                              role: 'cancel'
                            }
                          ]
                    });
                    await toast.present();
                    r(err);
                });
        });
    }
}