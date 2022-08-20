#ifndef __FOTA_H__
#define __FOTA_H__

#include "helpers/array_helpers.h"

/* *** Config section *** */

/* To use the fota, must define this in user_config.h

// Maximum size 1460 minus the protocol info
// TCP packet size is 1460 bytes and UDP packet size is 1472 bytes.
// 1460 - 4 = 1456 - 1 (form uid byte) - 1 (to uid byte) - 1 (port byte) - 1 (msg byte)

#define CHUNK_SIZE       1456


// Upgrade sector table
//                   | STEP5 | Sector User 1 | Sector User 2 |
//   (512KB + 512KB) |     4 |         0x001 |         0x081 |
// (1024KB + 1024KB) |     6 |         0x001 |         0x101 |

#define USER1_SECTOR    0x1
#define USER2_SECTOR    0x81

*/

void fota_msg_handler(array_builder_t* req, array_builder_t* res);

#endif