using AH.Protocol.Library.Helpers;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AH.Module.Simulation.Tests.Helpers
{
    [TestClass]
    public class BitFieldsTests
    {
        [TestMethod]
        public void Bool()
        {
            //                           76543210
            var value0 = Convert.ToByte("10100101", 2);

            Assert.IsTrue(BitFields.ReadBool(value0, 0));
            Assert.IsFalse(BitFields.ReadBool(value0, 1));
            Assert.IsTrue(BitFields.ReadBool(value0, 2));
            Assert.IsFalse(BitFields.ReadBool(value0, 3));
            Assert.IsFalse(BitFields.ReadBool(value0, 4));
            Assert.IsTrue(BitFields.ReadBool(value0, 5));
            Assert.IsFalse(BitFields.ReadBool(value0, 6));
            Assert.IsTrue(BitFields.ReadBool(value0, 7));

            var value1 = (byte)0;
            BitFields.SetBool(ref value1, 0, true);
            BitFields.SetBool(ref value1, 1, false);
            BitFields.SetBool(ref value1, 2, true);
            BitFields.SetBool(ref value1, 3, false);
            BitFields.SetBool(ref value1, 4, false);
            BitFields.SetBool(ref value1, 5, true);
            BitFields.SetBool(ref value1, 6, false);
            BitFields.SetBool(ref value1, 7, true);

            Assert.AreEqual(value0, value1);
        }

        [TestMethod]
        public void TwoBitsAsByte()
        {
            //                            3 2 1 0
            //                           76543210
            var value0 = Convert.ToByte("11100100", 2);

            Assert.AreEqual(BitFields.ReadTwoBitsAsByte(value0, 0), 0);
            Assert.AreEqual(BitFields.ReadTwoBitsAsByte(value0, 2), 1);
            Assert.AreEqual(BitFields.ReadTwoBitsAsByte(value0, 4), 2);
            Assert.AreEqual(BitFields.ReadTwoBitsAsByte(value0, 6), 3);

            //                             3 2 1 
            //                           76543210
            var value1 = Convert.ToByte("01110010", 2);

            Assert.AreEqual(BitFields.ReadTwoBitsAsByte(value1, 1), 1);
            Assert.AreEqual(BitFields.ReadTwoBitsAsByte(value1, 3), 2);
            Assert.AreEqual(BitFields.ReadTwoBitsAsByte(value1, 5), 3);

            var value2 = (byte)0;
            BitFields.SetByteIntoTwoBits(ref value2, 0, 0);
            BitFields.SetByteIntoTwoBits(ref value2, 2, 1);
            BitFields.SetByteIntoTwoBits(ref value2, 4, 2);
            BitFields.SetByteIntoTwoBits(ref value2, 6, 3);

            Assert.AreEqual(value0, value2);

            var value3 = (byte)0;
            BitFields.SetByteIntoTwoBits(ref value3, 1, 1);
            BitFields.SetByteIntoTwoBits(ref value3, 3, 2);
            BitFields.SetByteIntoTwoBits(ref value3, 5, 3);

            Assert.AreEqual(value1, value3);
        }
    }
}
