using Android.App;
using Android.OS;

namespace AH.Interface.Android
{
    [Activity(Label = "Auto Home", MainLauncher = true, Icon = "@drawable/icon")]
    public class MainActivity : Activity
    {
        protected override void OnCreate(Bundle bundle)
        {
            base.OnCreate(bundle);

            SetContentView(Resource.Layout.Main);

            var sendPort = 15556;
            var receivePort = 15555;

            App.AutoHome = new Protocol.Library.AutoHome(sendPort, receivePort);

            App.ShowModule(this);
            Finish();
        }
    }
}