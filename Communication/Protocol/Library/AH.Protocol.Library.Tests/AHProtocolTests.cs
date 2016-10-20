using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;

namespace AH.Protocol.Library.Test
{
    public class AHProtocolTests
    {
        private IAHProtocol _leftSide;
        private IAHProtocol _rightSide;
        private PassingThroughCouple _leftCouple;
        private PassingThroughCouple _rightCouple;
        private ManualResetEvent _event1;
        private ManualResetEvent _event2;

        public AHProtocolTests()
        {
            _leftCouple = new PassingThroughCouple();
            _rightCouple = new PassingThroughCouple();
            _leftCouple.Passing = _rightCouple;
            _rightCouple.Passing = _leftCouple;
            _leftSide = new AHProtocol(111, 600000, LeftSideMessageArrive, _leftCouple);
            _rightSide = new AHProtocol(666, 600000, RightSideMessageArrive, _rightCouple);
        }

        private void LeftSideMessageArrive(MessageArriveCode code, MessagePackage package)
        {
            Assert.True(code == MessageArriveCode.Ok);
        }

        private void RightSideMessageArrive(MessageArriveCode code, MessagePackage package)
        {
            Assert.True(code == MessageArriveCode.Ok);
        }

        [Fact]
        public void TestSimpleMsg()
        {
            _rightSide.MessageArrive = RightSideMessageArrive_TestSimpleMsg;
            _event1 = new ManualResetEvent(false);
            _leftSide.Send(666, new byte[] { 0, 120 });
            _event1.WaitOne();
        }

        private void RightSideMessageArrive_TestSimpleMsg(MessageArriveCode code, MessagePackage package)
        {
            Assert.True(code == MessageArriveCode.Ok);
            Assert.Equal(package.MessageBody, new byte[] { 0, 120 });
            _event1.Set();
        }

        [Fact]
        public void TestSimpleMsgCallback()
        {
            _rightSide.MessageArrive = RightSideMessageArrive_TestSimpleMsgCallback;
            _event1 = new ManualResetEvent(false);
            _leftSide.Send(666, new byte[] { 3, 120, 240, 67, 89, 12, 123, 45, 156, 165, 123, 155 },
                (MessageArriveCode code, MessagePackage package) =>
                {
                    RightSideMessageArrive_TestSimpleMsgCallback(code, package);
                    _event1.Set();
                });
            _event1.WaitOne();
        }

        private void RightSideMessageArrive_TestSimpleMsgCallback(MessageArriveCode code, MessagePackage package)
        {
            Assert.True(code == MessageArriveCode.Ok);
            Assert.Equal(package.MessageBody, new byte[] { 3, 120, 240, 67, 89, 12, 123, 45, 156, 165, 123, 155 });
        }

        [Fact]
        public void TestMultipleMsgCallback()
        {
            _leftSide.MessageArrive = LeftSideMessageArrive_TestMultipleMsgCallback;
            _rightSide.MessageArrive = RightSideMessageArrive_TestMultipleMsgCallback;
            _leftSide.TimeOut = 20000;
            _rightSide.TimeOut = 20000;

            var taskList = new List<Task>();
            var rnd = new Random(DateTime.Now.Millisecond);
            for (var ia = 0; ia < 10; ia++)
            {
                var bodyLength = rnd.Next(0, 1024);
                var body = new byte[bodyLength + 1];
                body[0] = (byte)rnd.Next(0, 5);
                for (var iu = 0; iu < bodyLength; iu++)
                {
                    body[iu + 1] = (byte)rnd.Next(0, 255);
                }

                if (rnd.Next(0, 100) < 50)
                {
                    var task = new Task(() =>
                    {
                        var event0 = new ManualResetEvent(false);
                        var mybody = body;
                        System.Diagnostics.Debug.WriteLine(string.Format("Sending from 111 to 666, body: {0}", mybody.ToString()));
                        _leftSide.Send(666, mybody,
                            (MessageArriveCode code, MessagePackage package) =>
                            {
                                System.Diagnostics.Debug.WriteLine(string.Format("Receveid from 111 to 666, messageID: {0} - body: {1}", package.MessageID.ToString(), package.MessageBody.ToString()));
                                Assert.True(code == MessageArriveCode.Ok);
                                Assert.Equal(mybody, package.MessageBody);
                                event0.Set();
                            });
                        event0.WaitOne();
                    });
                    taskList.Add(task);
                }
                else
                {
                    var task = new Task(() =>
                    {
                        var event0 = new ManualResetEvent(false);
                        var mybody = body;
                        System.Diagnostics.Debug.WriteLine(string.Format("Sending from 666 to 111, body: {0}", mybody.ToString()));
                        _rightSide.Send(111, mybody,
                            (MessageArriveCode code, MessagePackage package) =>
                            {
                                System.Diagnostics.Debug.WriteLine(string.Format("Receveid from 666 to 111, messageID: {0} - body: {1}", package.MessageID.ToString(), package.MessageBody.ToString()));
                                Assert.True(code == MessageArriveCode.Ok);
                                Assert.Equal(mybody, package.MessageBody);
                                event0.Set();
                            });
                        event0.WaitOne();
                    });
                    taskList.Add(task);
                }
            }

            taskList.ForEach(tl => tl.Start());

            Task.WaitAll(taskList.ToArray());
        }

        private void LeftSideMessageArrive_TestMultipleMsgCallback(MessageArriveCode code, MessagePackage package)
        {
            System.Diagnostics.Debug.WriteLine(string.Format("Arrived from 111 to 666, messageID: {0} - body: {1}", package.MessageID.ToString(), package.MessageBody.ToString()));
            Assert.True(code == MessageArriveCode.Ok);
        }

        private void RightSideMessageArrive_TestMultipleMsgCallback(MessageArriveCode code, MessagePackage package)
        {
            System.Diagnostics.Debug.WriteLine(string.Format("Arrived from 666 to 111, messageID: {0} - body: {1}", package.MessageID.ToString(), package.MessageBody.ToString()));
            Assert.True(code == MessageArriveCode.Ok);
        }
    }
}