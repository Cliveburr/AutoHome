#ifndef __FOTA_H__
#define __FOTA_H__

/* *** Config section *** */

/* To use the fota, must define this in user_config.h

// Maximum size 1460 minus the protocol info
// 1460 - 1(uid byte) - 1(port byte) - 1 (msg byte) = 1357

#define CHUNK_SIZE       1357


// Upgrade sector table
//                   | STEP5 | Sector User 1 | Sector User 2 |
//   (512KB + 512KB) |     4 |         0x001 |         0x081 |
// (1024KB + 1024KB) |     6 |         0x001 |         0x101 |

#define USER1_SECTOR    0x1
#define USER2_SECTOR    0x81

*/

void fota_tcp_handler(struct espconn* pesp_conn, char* data);

#endif