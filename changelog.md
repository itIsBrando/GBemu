## v4.6.85 07/12/23

### Features:
 - Added MBC3, MBC5, MBC7, and HuC1 to the save state system
 - New `OK` button style to menus
 - RAM and ROM sizes are now shown in kilobytes instead of bytes
 - A warning will arise if the header checksum fails

### Bug fixes:
 - Fixed settings and palette menu getting cut off on devices with top safe area
 - Fixed bug where saves with a name of length 1 being marked as 'untitled' instead of their respective letter
 - Alert menu no longer disappears when its content is modified
 - Fixed ROM Info not showing when paused

## v4.6.8 07/12/23

### Features:
 - Saves can no longer be overwritten
 - Added 1024x1024 icon
 - Imported saves use the file's name by default

### Bug fixes:
 - Save menu no longer disappears when saving.
 - Menus do not disappear when invalid data has been presented
 - Removed extraneuos whitespaces from save names