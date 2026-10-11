export const SEAT_COLORS = ["#ff5d73", "#ffb830", "#b388ff", "#2ee6a6", "#ff8c42"];
export const seatColor = (seat: number): string => SEAT_COLORS[seat % SEAT_COLORS.length] as string;
