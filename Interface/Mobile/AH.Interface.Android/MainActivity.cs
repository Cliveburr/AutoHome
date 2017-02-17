using Android.App;
using Android.Widget;
using Android.OS;
using AH.Interface.Android.Protocol;
using Android.Net;

namespace AH.Interface.Android
{
    [Activity(Label = "Auto Home", MainLauncher = true, Icon = "@drawable/icon")]
    public class MainActivity : Activity
    {
        public Button btTest;

        protected override void OnCreate(Bundle bundle)
        {
            base.OnCreate(bundle);

            if (App.IsConnected())
            {
                App.ShowArea(this);
                Finish();
            }
            else
            {
                App.ShowDiscovery(this, () =>
                {
                    App.ShowArea(this);
                    Finish();
                });
            }


            //SetContentView(Resource.Layout.Main);

            //btTest = FindViewById<Button>(Resource.Id.button3);
            //btTest.Click += btTest_Click;
        }

        private void btTest_Click(object sender, System.EventArgs e)
        {
            var connectivityManager = (ConnectivityManager)GetSystemService(ConnectivityService);
            var networkInfo = connectivityManager.ActiveNetworkInfo;
            if (networkInfo?.IsConnected ?? false)
            {
                var ah = new AutoHomeProtocol(15556, 15555);
                //ah.ReceivePong += Ah_ReceivePong;
                ah.SendPing();

                Toast.MakeText(this, "pingando", ToastLength.Short).Show();
            }
            else
            {
                Toast.MakeText(this, "sem conexão", ToastLength.Long).Show();
            }
        }

        private void Ah_ReceivePong(System.Net.IPAddress address)
        {
            RunOnUiThread(() => {
                Toast.MakeText(this, address?.ToString() ?? "fail", ToastLength.Long).Show();
            });
        }
    }
}