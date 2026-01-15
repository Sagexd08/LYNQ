import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/Section';

const data = [
    { name: 'Jan', supply: 4000, borrow: 2400 },
    { name: 'Feb', supply: 3000, borrow: 1398 },
    { name: 'Mar', supply: 2000, borrow: 9800 },
    { name: 'Apr', supply: 2780, borrow: 3908 },
    { name: 'May', supply: 1890, borrow: 4800 },
    { name: 'Jun', supply: 2390, borrow: 3800 },
    { name: 'Jul', supply: 3490, borrow: 4300 },
];

export function MarketChart({ title = "Market Activity" }: { title?: string }) {
    return (
        <Card className="w-full h-[400px] p-6">
            <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorBorrow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="supply"
                            stroke="#06b6d4"
                            fillOpacity={1}
                            fill="url(#colorSupply)"
                            name="Total Supply"
                        />
                        <Area
                            type="monotone"
                            dataKey="borrow"
                            stroke="#8b5cf6"
                            fillOpacity={1}
                            fill="url(#colorBorrow)"
                            name="Total Borrow"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
