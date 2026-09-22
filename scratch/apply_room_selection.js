const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'host-dashboard', 'components', 'AddPropertyModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Header click
const target1 = `                                    setFormData(prev => {
                                      const isSel = prev.roomTypes.includes(roomType);
                                      const newRoomTypes = isSel
                                        ? prev.roomTypes.filter(t => t !== roomType)
                                        : [...prev.roomTypes, roomType];
                                      
                                      const newCounts = { ...prev.roomTypeCounts };
                                      const newSpecs = { ...prev.roomTypeSpecs };
                                      if (isSel) {
                                        delete newCounts[roomType];
                                      } else {
                                        newCounts[roomType] = 1;
                                        if (!newSpecs[roomType]) {
                                          newSpecs[roomType] = getDefaultSpecsForRoomType(roomType);
                                        }
                                      }
                                      
                                      return { ...prev, roomTypes: newRoomTypes, roomTypeCounts: newCounts, roomTypeSpecs: newSpecs };
                                    });`;

const replace1 = `                                    setFormData(prev => {
                                      const isSel = prev.roomTypes.includes(roomType);
                                      const isSelectingEntireResort = roomType === 'Entire Resort';

                                      let newRoomTypes: string[];
                                      if (isSelectingEntireResort) {
                                        newRoomTypes = isSel ? [] : ['Entire Resort'];
                                      } else {
                                        newRoomTypes = isSel
                                          ? prev.roomTypes.filter(t => t !== roomType)
                                          : [...prev.roomTypes.filter(t => t !== 'Entire Resort'), roomType];
                                      }

                                      const newCounts: Record<string, number> = {};
                                      const newSpecs: Record<string, RoomTypeSpec> = {};
                                      const newPrices: Record<string, number | string> = {};
                                      const newWeekendPrices: Record<string, number | string> = {};
                                      const newAmenities: Record<string, number[]> = {};

                                      newRoomTypes.forEach(t => {
                                        newCounts[t] = prev.roomTypeCounts[t] || 1;
                                        newSpecs[t] = prev.roomTypeSpecs?.[t] || getDefaultSpecsForRoomType(t);
                                        if (prev.roomTypePrices?.[t] !== undefined) newPrices[t] = prev.roomTypePrices[t];
                                        if (prev.roomTypeWeekendPrices?.[t] !== undefined) newWeekendPrices[t] = prev.roomTypeWeekendPrices[t];
                                        if (prev.roomTypeAmenities?.[t] !== undefined) newAmenities[t] = prev.roomTypeAmenities[t];
                                      });

                                      return {
                                        ...prev,
                                        roomTypes: newRoomTypes,
                                        roomTypeCounts: newCounts,
                                        roomTypeSpecs: newSpecs,
                                        roomTypePrices: newPrices,
                                        roomTypeWeekendPrices: newWeekendPrices,
                                        roomTypeAmenities: newAmenities,
                                        totalRooms: newRoomTypes.includes('Entire Resort') ? 1 : prev.totalRooms,
                                      };
                                    });`;

// 2. X click
const target2 = `                                            setFormData(prev => {
                                              const newRoomTypes = prev.roomTypes.filter(t => t !== roomType);
                                              const newCounts = { ...prev.roomTypeCounts };
                                              const newSpecs = { ...prev.roomTypeSpecs };
                                              delete newCounts[roomType];
                                              delete newSpecs[roomType];
                                              return { ...prev, roomTypes: newRoomTypes, roomTypeCounts: newCounts, roomTypeSpecs: newSpecs };
                                            });`;

const replace2 = `                                            setFormData(prev => {
                                              const newRoomTypes = prev.roomTypes.filter(t => t !== roomType);
                                              const newCounts = { ...prev.roomTypeCounts };
                                              const newSpecs = { ...prev.roomTypeSpecs };
                                              const newPrices = { ...prev.roomTypePrices };
                                              const newWeekendPrices = { ...prev.roomTypeWeekendPrices };
                                              const newAmenities = { ...prev.roomTypeAmenities };
                                              delete newCounts[roomType];
                                              delete newSpecs[roomType];
                                              delete newPrices[roomType];
                                              delete newWeekendPrices[roomType];
                                              delete newAmenities[roomType];
                                              return {
                                                ...prev,
                                                roomTypes: newRoomTypes,
                                                roomTypeCounts: newCounts,
                                                roomTypeSpecs: newSpecs,
                                                roomTypePrices: newPrices,
                                                roomTypeWeekendPrices: newWeekendPrices,
                                                roomTypeAmenities: newAmenities,
                                              };
                                            });`;

// 3. Add click
const target3 = `                                        setFormData(prev => {
                                          const newRoomTypes = [...prev.roomTypes, roomType];
                                          const newCounts = { ...prev.roomTypeCounts, [roomType]: 1 };
                                          const newSpecs = { ...prev.roomTypeSpecs };
                                          if (!newSpecs[roomType]) {
                                            newSpecs[roomType] = getDefaultSpecsForRoomType(roomType);
                                          }
                                          return { ...prev, roomTypes: newRoomTypes, roomTypeCounts: newCounts, roomTypeSpecs: newSpecs };
                                        });`;

const replace3 = `                                        setFormData(prev => {
                                          const isSelectingEntireResort = roomType === 'Entire Resort';
                                          let newRoomTypes: string[];
                                          if (isSelectingEntireResort) {
                                            newRoomTypes = ['Entire Resort'];
                                          } else {
                                            newRoomTypes = [...prev.roomTypes.filter(t => t !== 'Entire Resort'), roomType];
                                          }

                                          const newCounts: Record<string, number> = {};
                                          const newSpecs: Record<string, RoomTypeSpec> = {};
                                          const newPrices: Record<string, number | string> = {};
                                          const newWeekendPrices: Record<string, number | string> = {};
                                          const newAmenities: Record<string, number[]> = {};

                                          newRoomTypes.forEach(t => {
                                            newCounts[t] = prev.roomTypeCounts[t] || 1;
                                            newSpecs[t] = prev.roomTypeSpecs?.[t] || getDefaultSpecsForRoomType(t);
                                            if (prev.roomTypePrices?.[t] !== undefined) newPrices[t] = prev.roomTypePrices[t];
                                            if (prev.roomTypeWeekendPrices?.[t] !== undefined) newWeekendPrices[t] = prev.roomTypeWeekendPrices[t];
                                            if (prev.roomTypeAmenities?.[t] !== undefined) newAmenities[t] = prev.roomTypeAmenities[t];
                                          });

                                          return {
                                            ...prev,
                                            roomTypes: newRoomTypes,
                                            roomTypeCounts: newCounts,
                                            roomTypeSpecs: newSpecs,
                                            roomTypePrices: newPrices,
                                            roomTypeWeekendPrices: newWeekendPrices,
                                            roomTypeAmenities: newAmenities,
                                            totalRooms: newRoomTypes.includes('Entire Resort') ? 1 : prev.totalRooms,
                                          };
                                        });`;

let count = 0;
if (content.includes(target1)) {
  content = content.replace(target1, replace1);
  count++;
  console.log('Target 1 replaced!');
} else {
  console.log('Target 1 not found!');
}

if (content.includes(target2)) {
  content = content.replace(target2, replace2);
  count++;
  console.log('Target 2 replaced!');
} else {
  console.log('Target 2 not found!');
}

if (content.includes(target3)) {
  content = content.replace(target3, replace3);
  count++;
  console.log('Target 3 replaced!');
} else {
  console.log('Target 3 not found!');
}

if (count > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully applied ${count} changes to AddPropertyModal.tsx`);
}
