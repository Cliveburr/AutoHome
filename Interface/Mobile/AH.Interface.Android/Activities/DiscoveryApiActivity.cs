using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Views;
using Android.Widget;
using System.Net;
using AH.Interface.Android.Protocol;
using System.Timers;

namespace AH.Interface.Android.Activities
{
    public delegate void DiscoveryCallbak();

    [Activity(Label = "Auto Home")]
    public class DiscoveryApiActivity : Activity
    {
        public Button btDiscovery;
        public TextView txResult;

        private AutoHomeProtocol _protocol;
        private Timer _redirect;

        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);

            SetContentView(Resource.Layout.DiscoveryApi);

            txResult = FindViewById<TextView>(Resource.Id.txResult);
            btDiscovery = FindViewById<Button>(Resource.Id.btDiscover);
            btDiscovery.Click += BtDiscovery_Click;

            SetRunnning();
        }

        private void BtDiscovery_Click(object sender, EventArgs e)
        {
            SetRunnning();
        }

        public void SetRunnning()
        {
            btDiscovery.Enabled = false;
            txResult.Text = "Discovering...";

            _protocol = new AutoHomeProtocol(15556, 15555);
            _protocol.ReceivePong += _protocol_ReceivePong;
            _protocol.SendPing();
        }

        private void _protocol_ReceivePong(string address, Exception err)
        {
            RunOnUiThread(() => {
                if (err == null)
                    SetOk(address);
                else
                    SetFail(err);
            });
        }

        public void SetFail(Exception err)
        {
            _protocol.Dispose();

            btDiscovery.Enabled = true;
            txResult.Text = $"Fail to discovery the api!\r\nError: {err.ToString()}";
        }

        public void SetOk(string address)
        {
            _protocol.Dispose();

            App.ApiAddress = address;
            txResult.Text = $"Success to discovery the api!\r\nAddress: {address}\r\nRedirecting...";

            _redirect = new Timer();
            _redirect.Interval = 3000;
            _redirect.Elapsed += _redirect_Elapsed; ;
            _redirect.Start();
        }

        private void _redirect_Elapsed(object sender, ElapsedEventArgs e)
        {
            _redirect.Stop();

            RunOnUiThread(() => App.DiscoveryCallbak?.Invoke());

            Finish();
        }
    }
}