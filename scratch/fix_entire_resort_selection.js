const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'app', 'host-dashboard', 'components', 'AddPropertyModal.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update propertyToEdit initialization
const oldPropToEdit = `      setFormData({
        name: propertyToEdit.title || propertyToEdit.name || '',
        description: propertyToEdit.description || '',
        price: propertyToEdit.price_per_night || propertyToEdit.price || '',
        weekendPrice: propertyToEdit.weekend_price_per_night || propertyToEdit.weekendPrice || '',
        location: propertyToEdit.location || '',
        type: propertyToEdit.tier || '',
        roomTypes: (propertyToEdit.room_types && propertyToEdit.room_types.length > 0)
          ? propertyToEdit.room_types
          : (
              propertyToEdit.room_type && 
              !propertyToEdit.room_type.includes('[') && 
              !propertyToEdit.room_type.includes(',') && 
              propertyToEdit.room_type.length < 50
                ? [propertyToEdit.room_type]
                : (PROPERTY_ROOM_TYPES[(propertyToEdit.tier || propertyToEdit.type || '').toLowerCase()] || [])
            ),`;

const newPropToEdit = `      const rawRoomTypes: string[] = (propertyToEdit.room_types && propertyToEdit.room_types.length > 0)
        ? propertyToEdit.room_types
        : (
            propertyToEdit.room_type && 
            !propertyToEdit.room_type.includes('[') && 
            !propertyToEdit.room_type.includes(',') && 
            propertyToEdit.room_type.length < 50
              ? [propertyToEdit.room_type]
              : []
          );
      const isEntireResortEdit = rawRoomTypes.includes('Entire Resort');
      const initialRoomTypes = isEntireResortEdit ? ['Entire Resort'] : rawRoomTypes;

      const rawAmenities = (propertyToEdit as any).room_type_amenities || {};
      const rawCounts = (propertyToEdit as any).room_type_counts || {};
      const rawPrices = (propertyToEdit as any).room_type_prices || {};
      const rawWeekendPrices = (propertyToEdit as any).room_type_weekend_prices || {};
      const rawSpecs = (propertyToEdit as any).room_type_specs || (propertyToEdit as any).room_type_amenities?._specs || {};

      const initialAmenities: Record<string, number[]> = {};
      const initialCounts: Record<string, number> = {};
      const initialPrices: Record<string, number | string> = {};
      const initialWeekendPrices: Record<string, number | string> = {};
      const initialSpecs: Record<string, RoomTypeSpec> = {};

      initialRoomTypes.forEach(rt => {
        if (rawAmenities[rt]) initialAmenities[rt] = rawAmenities[rt];
        initialCounts[rt] = rawCounts[rt] || 1;
        if (rawPrices[rt] !== undefined) initialPrices[rt] = rawPrices[rt];
        if (rawWeekendPrices[rt] !== undefined) initialWeekendPrices[rt] = rawWeekendPrices[rt];
        initialSpecs[rt] = rawSpecs[rt] || getDefaultSpecsForRoomType(rt);
      });

      setFormData({
        name: propertyToEdit.title || propertyToEdit.name || '',
        description: propertyToEdit.description || '',
        price: propertyToEdit.price_per_night || propertyToEdit.price || '',
        weekendPrice: propertyToEdit.weekend_price_per_night || propertyToEdit.weekendPrice || '',
        location: propertyToEdit.location || '',
        type: propertyToEdit.tier || '',
        roomTypes: initialRoomTypes,`;

if (content.includes(oldPropToEdit)) {
  content = content.replace(oldPropToEdit, newPropToEdit);
  console.log('Replaced propertyToEdit roomTypes initialization!');
} else {
  console.log('oldPropToEdit not found by exact string!');
}

// Also update the fields in setFormData for propertyToEdit
const oldDicts = `        roomTypeAmenities: (propertyToEdit as any).room_type_amenities || {},
        roomTypeCounts: (propertyToEdit as any).room_type_counts || {},
        roomTypePrices: (propertyToEdit as any).room_type_prices || {},
        roomTypeWeekendPrices: (propertyToEdit as any).room_type_weekend_prices || {},
        roomTypeSpecs: (propertyToEdit as any).room_type_specs || (propertyToEdit as any).room_type_amenities?._specs || {},`;

const newDicts = `        roomTypeAmenities: initialAmenities,
        roomTypeCounts: initialCounts,
        roomTypePrices: initialPrices,
        roomTypeWeekendPrices: initialWeekendPrices,
        roomTypeSpecs: initialSpecs,`;

if (content.includes(oldDicts)) {
  content = content.replace(oldDicts, newDicts);
  console.log('Replaced propertyToEdit dictionaries!');
} else {
  console.log('oldDicts not found by exact string!');
}

// 2. Update room type header click handler
const oldHeaderClick = `                                    setFormData(prev => {
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

const newHeaderClick = `                                    setFormData(prev => {
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

if (content.includes(oldHeaderClick)) {
  content = content.replace(oldHeaderClick, newHeaderClick);
  console.log('Replaced header click handler!');
} else {
  console.log('oldHeaderClick not found by exact string!');
}

// 3. Update room type "Add" button click handler
const oldAddClick = `                                       onClick={() => {
                                         setFormData(prev => {
                                           const newRoomTypes = [...prev.roomTypes, roomType];
                                           const newCounts = { ...prev.roomTypeCounts, [roomType]: 1 };
                                           const newSpecs = { ...prev.roomTypeSpecs };
                                           if (!newSpecs[roomType]) {
                                             newSpecs[roomType] = getDefaultSpecsForRoomType(roomType);
                                           }
                                           return { ...prev, roomTypes: newRoomTypes, roomTypeCounts: newCounts, roomTypeSpecs: newSpecs };
                                         });
                                         if (isHotelOrResort) {
                                           setExpandedRoomSpecs(prev => ({ ...prev, [roomType]: true }));
                                         }
                                       }}`;

const newAddClick = `                                       onClick={() => {
                                         setFormData(prev => {
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
                                         });
                                         if (isHotelOrResort) {
                                           setExpandedRoomSpecs(prev => ({ ...prev, [roomType]: true }));
                                         }
                                       }}`;

if (content.includes(oldAddClick)) {
  content = content.replace(oldAddClick, newAddClick);
  console.log('Replaced Add button click handler!');
} else {
  console.log('oldAddClick not found by exact string!');
}

// 4. Update X button click handler
const oldXClick = `                                              setFormData(prev => {
                                                const newRoomTypes = prev.roomTypes.filter(t => t !== roomType);
                                                const newCounts = { ...prev.roomTypeCounts };
                                                const newSpecs = { ...prev.roomTypeSpecs };
                                                delete newCounts[roomType];
                                                delete newSpecs[roomType];
                                                return { ...prev, roomTypes: newRoomTypes, roomTypeCounts: newCounts, roomTypeSpecs: newSpecs };
                                              });`;

const newXClick = `                                              setFormData(prev => {
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
                                                  roomTypeAmenities: newAmenities
                                                };
                                              });`;

if (content.includes(oldXClick)) {
  content = content.replace(oldXClick, newXClick);
  console.log('Replaced X button click handler!');
} else {
  console.log('oldXClick not found by exact string!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
