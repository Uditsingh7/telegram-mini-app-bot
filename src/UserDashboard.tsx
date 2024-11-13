'use client';

import { useState, useEffect } from 'react';
import { Home, CheckSquare, Users, CreditCard, DollarSign, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTelegram, ITelegramUser } from './WithTelegramProvider'

declare global {
  interface Window {
    Telegram: any;
  }
}

// Define the Task type
interface Task {
  id: number;
  name: string;
  description: string;
  completed: boolean;
}

const defaultTasks: Task[] = [
  { id: 1, name: 'Join Telegram Channel', description: 'Join our official channel', completed: false },
  { id: 2, name: 'Invite Friends', description: 'Invite 5 friends to the app', completed: false },
]

export default function UserDashboard() {
  const { user, webApp } = useTelegram();
  const [loading, setLoading] = useState<boolean>(true);
  const [hasJoinedChannel, setHasJoinedChannel] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [metaData, setMetaData] = useState<any>({});
  const [WithdrawalData, setWithdrawalData] = useState<any>({});
  const [referralLink, setReferralLink] = useState('https://t.me/YourBot?start=123456');
  const [referralCount, setReferralCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  // const [referralCode, setReferralCode] = useState<string | null>(null);
  console.log(webApp, userData, setReferralCount, setReferralLink)

  useEffect(() => {
    const handleUserAndTasks = async () => {
      if (user) {
        await createOrUpdateUser(user);
        await fetchAppMetadata(user)
      }
      await fetchTasks(); // Then fetch tasks after user handling

    };

    handleUserAndTasks();
  }, [user]);

  const savePaymentDetails = async () => {
    try {
      const withdrwaBody = {
        userId: userData?._id,
        ...WithdrawalData
      }
      await axios.post('http://localhost:5000/api/users/payment-details', withdrwaBody)
      toast.success('Payment details saved successfully!');
    } catch (error: any) {
      console.error("Error in createOrUpdateUser:", error.response?.data || error.message);
    }
  }

  const createOrUpdateUser = async (user: ITelegramUser) => {
    if (!user) {
      console.error("No user data provided.");
      return;
    }

    const { id, username, first_name: firstName, last_name: lastName } = user;

    try {
      // Create or update user
      const { data: userResponse } = await axios.post('http://localhost:5000/api/users/create-or-update', {
        userId: id,
        username,
        firstName,
        lastName
      });

      // Update user data state
      setUserData(userResponse);

      // Check if the user is a member of the channel
      const { data: membershipCheck } = await axios.get(`http://localhost:5000/api/users/isMember`, {
        params: { userId: id }
      });

      // Update state based on membership
      setHasJoinedChannel(membershipCheck.isMember);
      setLoading(false)
      setBalance(userResponse.balance || 0);

    } catch (error: any) {
      setLoading(false)
      console.error("Error in createOrUpdateUser:", error.response?.data || error.message);
    }
  };


  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tasks');
      console.log("task: ", response)
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };
  const fetchAppMetadata = async (user: ITelegramUser) => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/settings?config=AppMetaData');
      console.log("task: ", response)
      const metaDataRes = response?.data?.value
      setMetaData(metaDataRes);
      const refLink = `https://t.me/${metaDataRes?.botUsermame}?start=referral_${user.id}`;
      setReferralLink(refLink)
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleJoinChannel = async () => {
    try {

      if (!hasJoinedChannel) {
        // Open the Telegram channel link in a new tab
        window.open(metaData?.channelLink, '_blank');
      }
    }
    catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handlePromoteChannel = async () => {
    // alert(metaData?.adChannelLink)
    const telegram = window.Telegram?.WebApp;
    try {
      // Open the Telegram channel link in a new tab
      telegram.openLink(metaData?.channelLink, '_blank');
    }
    catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleClaimTask = async (task: any) => {
    const telegram = window.Telegram?.WebApp;
    try {
      const channelLink = `https://t.me/${task?.channelId}`;
      // Open the Telegram channel link in a new tab
      telegram.openLink(channelLink, '_blank');
    }
    catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Handle input change and update the state dynamically
  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    // Dynamically update the corresponding field in the withdrawalData object
    setWithdrawalData((prevData: any) => ({
      ...prevData,
      [id]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-lg text-gray-700">Loading, please wait...</p>
      </div>
    );
  }

  if (!hasJoinedChannel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 text-gray-800 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-indigo-700">Welcome to Our Community</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-center text-gray-600">Please join our official Telegram channel to access exclusive content and rewards.</p>
            <Button onClick={handleJoinChannel} className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200">
              Join Channel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-800">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <TabsContent value="home">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-indigo-700">Welcome Back, {user?.first_name}!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-6 text-indigo-600">Total Balance: {balance} points</p>
                <div className="aspect-video bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg mb-6 flex items-center justify-center text-white text-xl font-bold">
                  <img src={metaData?.homeImageLink || "https://th.bing.com/th/id/OIG4.z6Qu2kckn4._tuLj3ETT?w=270&h=270&c=6&r="} alt="Banner" className="object-cover w-full h-full rounded-lg" />
                </div>
                <Button onClick={handlePromoteChannel} variant="outline" className="w-full border-indigo-500 text-indigo-700 hover:bg-indigo-100 transition-colors duration-200">
                  Promote Your Ad
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-indigo-700">Available Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between mb-4 p-4 border rounded-lg hover:bg-indigo-50 transition-colors duration-200">
                    <div>
                      <h3 className="font-semibold text-indigo-600">{task.name}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <Button
                      onClick={() => handleClaimTask(task)}
                      disabled={task.completed}
                      className={`${task.completed ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition-colors duration-200`}
                    >
                      {task.completed ? <Check className="h-4 w-4" /> : 'Claim'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refer">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-indigo-700">Refer & Earn</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600">Share your referral link and earn points for each new user!</p>
                <div className="bg-indigo-100 p-3 rounded-lg mb-4 break-all text-indigo-700 font-mono text-sm">
                  {referralLink}
                </div>
                <Button variant="outline" className="w-full mb-6 border-indigo-500 text-indigo-700 hover:bg-indigo-100 transition-colors duration-200" onClick={() => navigator.clipboard.writeText(referralLink)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Link
                </Button>
                <p className="text-center text-lg font-semibold text-indigo-600">Total Referrals: <span className="text-2xl">{referralCount}</span></p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-indigo-700">Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-gray-600">Enter your payment details to set up automatic weekly withdrawals.</p>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="exchange-id" className="text-sm font-medium text-gray-700">Exchange ID</Label>
                    <Input type="text" id="exchangeId" placeholder="Enter your exchange ID" className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      onChange={handleWithdrawChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="crypto-address" className="text-sm font-medium text-gray-700">Crypto Address</Label>
                    <Input type="text" id="cryptoAddress" placeholder="Enter your crypto address" className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      onChange={handleWithdrawChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-details" className="text-sm font-medium text-gray-700">Bank Details</Label>
                    <Input type="text" id="bankDetails" placeholder="Enter your bank details" className="w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      onChange={handleWithdrawChange}
                    />
                  </div>
                  <Button onClick={savePaymentDetails} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-200">Save Payment Details</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earn">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-indigo-700">Earn Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 border rounded-lg hover:bg-indigo-50 transition-colors duration-200">
                    <h3 className="font-semibold text-lg text-indigo-600 mb-2">Staking Pool</h3>
                    <p className="text-sm text-gray-600 mb-4">Stake your tokens and earn passive income.</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1 border-indigo-500 text-indigo-700 hover:bg-indigo-100 transition-colors duration-200">Deposit</Button>
                      <Button variant="outline" className="flex-1 border-indigo-500 text-indigo-700 hover:bg-indigo-100 transition-colors duration-200">Withdraw</Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-indigo-50 transition-colors duration-200">
                    <h3 className="font-semibold text-lg text-indigo-600 mb-2">Yield Farming</h3>
                    <p className="text-sm text-gray-600 mb-4">Provide liquidity and earn high APY.</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1 border-indigo-500 text-indigo-700 hover:bg-indigo-100 transition-colors duration-200">Deposit</Button>
                      <Button variant="outline" className="flex-1 border-indigo-500 text-indigo-700 hover:bg-indigo-100 transition-colors duration-200">Withdraw</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </main>
        <TabsList className="fixed bottom-0 left-0 right-0 h-16 grid grid-cols-5 bg-white border-t border-gray-200 shadow-lg">
          <TabsTrigger value="home" className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors duration-200">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors duration-200">
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="refer" className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors duration-200">
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Refer</span>
          </TabsTrigger>
          <TabsTrigger value="withdraw" className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors duration-200">
            <CreditCard className="h-5 w-5" />
            <span className="text-xs mt-1">Withdraw</span>
          </TabsTrigger>
          <TabsTrigger value="earn" className="flex flex-col items-center justify-center text-gray-600 hover:text-indigo-600 transition-colors duration-200">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs mt-1">Earn</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
