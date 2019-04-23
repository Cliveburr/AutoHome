#ifndef __FOTA_H__
#define __FOTA_H__

/* *** Config section *** */

/* To use the fota, must define this in user_config.h

// Maximum size 1460 minus the protocol info
// 1460 - 1(UID) - 1(type) = 1358

#define CHUNK_SIZE       1358


// Upgrade sector table
//                   | STEP5 | Sector User 1 | Sector User 2 |
// (1024KB + 1024KB) |     6 |         0x001 |         0x101 |

#define USER1_SECTOR    0x001
#define USER2_SECTOR    0x101

*/

void fotaStateRead(struct espconn *pesp_conn);

void fotaStart(char *data);

void fotaWrite(struct espconn *pesp_conn, char *data);

#endif