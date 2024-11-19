'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronRight, Copy, CreditCard, DollarSign, Home, Users, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTelegram, ITelegramUser } from './WithTelegramProvider'
import bannerImage from './assets/img/image.png';
import loadingImage from './assets/img/loading.png'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const base = `http://44.202.40.234:5000/`
declare global {
  interface Window {
    Telegram: any;
  }
}

// Define the Task type
interface Task {
  _id?: any;
  id: number;
  name: string;
  description: string;
  channelId: string;
  completed: boolean;
}

interface EarnOpp {
  id: number;
  name: string;
  description: string;
  depositLink: string;
  withdrawLink: string;
}

const defaultTasks: Task[] = [
  { id: 1, name: 'Join Telegram Channel', description: 'Join our official channel', channelId: "1234", completed: false },
  { id: 2, name: 'Invite Friends', description: 'Invite 5 friends to the app', channelId: "1234", completed: false },
]

const defaultEarnOpp: EarnOpp[] = [
  { id: 1, name: 'Earn 12% Monthly Apy', description: "Earn 12% monthly APY, risk-free..", depositLink: 't.me/QMEAdmin', withdrawLink: " t.me/qmeadmin" },
]

export default function UserDashboard() {
  const { user, webApp } = useTelegram();
  const [loading, setLoading] = useState<boolean>(true);
  const [hasJoinedChannel, setHasJoinedChannel] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [balance, setBalance] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [earnOpp, setEarnOpp] = useState<EarnOpp[]>(defaultEarnOpp);
  const [metaData, setMetaData] = useState<any>({});
  // const [withdrawalData, setWithdrawalData] = useState<any>({});
  const [referralLink, setReferralLink] = useState('https://t.me/YourBot?start=123456');
  const [referralCount, setReferralCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [withdrawalMethod, setWithdrawalMethod] = useState<"UPI" | "CRYPTO" | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    upiId: "",
    coinName: "",
    cryptoAddress: "",
    cryptoNetwork: ""
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  // const handleConfirm = () => {
  //   // Here you would typically send the data to your backend
  //   console.log("Withdrawal details:", { method: withdrawalMethod, ...formData })
  //   toast.success("Your withdrawal details have been successfully saved.")
  //   // Reset form after submission
  //   setWithdrawalMethod(null)
  //   setFormData({
  //     name: "",
  //     upiId: "",
  //     coinName: "",
  //     cryptoAddress: "",
  //     cryptoNetwork: ""
  //   })
  // }
  // const [referralCode, setReferralCode] = useState<string | null>(null);
  console.log(webApp, userData, setReferralCount, setReferralLink)

  useEffect(() => {
    const handleUserAndTasks = async () => {
      if (user) {
        await createOrUpdateUser(user);
        await fetchAppMetadata(user)
      }
      await fetchTasks(); // Then fetch tasks after user handling
      await fetchEarnOpp();

    };

    handleUserAndTasks();
  }, [user]);

  const saveWithdrawalDetails = async (userId: any, method: any, details: any) => {
    try {
      const response = await axios.post(`${base}api/users/withdraw-details`, {
        userId,
        method,
        details,
      });
      return response.data;
    } catch (error) {
      console.error('Error saving withdrawal details:', error);
      return { success: false, message: 'Failed to save withdrawal details' };
    }
  };

  const handleConfirm = async () => {
    const details =
      withdrawalMethod === "UPI"
        ? {
          name: formData.name,
          upiId: formData.upiId,
        }
        : {
          coinName: formData.coinName,
          cryptoAddress: formData.cryptoAddress,
          cryptoNetwork: formData.cryptoNetwork,
        };

    console.log("Withdraw Details:", details)

    const response = await saveWithdrawalDetails(user?.id, withdrawalMethod, details);

    if (response.success) {
      toast.success("Withdrawal details saved successfully!");
      // Reset form or perform any other actions
      setWithdrawalMethod(null);
      setFormData({
        name: "",
        upiId: "",
        coinName: "",
        cryptoAddress: "",
        cryptoNetwork: ""
      });
    } else {
      toast.error(response.message || "Failed to save withdrawal details.");
    }
  };


  const createOrUpdateUser = async (user: ITelegramUser) => {
    if (!user) {
      console.error("No user data provided.");
      return;
    }

    const { id, username, first_name: firstName, last_name: lastName } = user;

    try {
      // Create or update user
      const { data: userResponse } = await axios.post(`${base}api/users/create-or-update`, {
        userId: id,
        username,
        firstName,
        lastName
      });

      // Update user data state
      setUserData(userResponse);
      console.log("userResponse:", userResponse)

      // Check if the user is a member of the channel
      const { data: membershipCheck } = await axios.get(`${base}api/users/isMember`, {
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
      const response = await axios.get(`${base}api/tasks`);
      console.log("task: ", response)
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchEarnOpp = async () => {
    try {

      const response = await axios.get(`${base}api/users/earn-opp`);
      console.log("earn opp: ", response)
      setEarnOpp(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchAppMetadata = async (user: ITelegramUser) => {
    try {
      const response = await axios.get(`${base}api/users/settings?config=AppMetaData`);
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
      telegram.openLink(metaData?.adChannelLink, '_blank');
    }
    catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleClaimTask = async (task: Task) => {
    const telegram = window.Telegram?.WebApp;
    try {
      // const channelLink = `https://t.me/${task?.channelId}`;
      // // Open the Telegram channel link in a new tab
      // telegram.openLink(channelLink, '_blank');
      const body = {
        userId: user?.id,
        taskId: task._id
      }
      console.log('Claim body: ', body)
      const response = await axios.post(`${base}api/tasks/claim-task`, body)
      console.log("Claim task: ", response)
      // Show toast with the API message
      if (response?.data?.message) {
        toast.success(response.data.message);
      }
      if (response?.data?.redirectUrl) {
        const channelLink = response?.data?.redirectUrl;
        telegram.openLink(channelLink, '_blank');
      }

    }
    catch (error: any) {
      console.error("Error fetching tasks:", error);
      // Show toast with error message
      const errorMessage = error.response?.data?.error || "An unexpected error occurred.";
      toast.error(errorMessage);
    }
  };

  const handleDepostitEarnOpp = async (earnOpp: any) => {
    const telegram = window.Telegram?.WebApp;
    try {
      const channelLink = `https://${earnOpp?.depositLink}`
      telegram.openLink(channelLink, '_blank')
    }
    catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  const handleWithdrawEarnOpp = async (earnOpp: any) => {
    const telegram = window.Telegram?.WebApp;
    try {
      const channelLink = `https://${earnOpp?.withdrawLink}`
      telegram.openLink(channelLink, '_blank')
    }
    catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <img
          src={loadingImage} // Replace with your actual image path
          alt="Loading"
          className="h-full w-full object-contain"
        />
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <header className="p-4 bg-black bg-opacity-30 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${user?.first_name}`} />
                <AvatarFallback>{user?.first_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">Welcome, {user?.first_name}!</h1>
                <p className="text-sm text-indigo-200">Your Crypto Journey Awaits</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{balance} ₹</p>
              <p className="text-xs text-indigo-200">Current Balance</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <TabsContent value="home">
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl overflow-hidden">
                <div className="relative h-40">
                  <img
                    src={bannerImage}
                    alt="Promotional Banner"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <h2 className="text-2xl font-bold text-white">Crypto Rewards Await!</h2>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-indigo-200">Per Referral</p>
                      <p className="text-lg font-bold">5 ₹</p>
                    </div>
                    <div>
                      <p className="text-sm text-indigo-200">Per Task</p>
                      <p className="text-lg font-bold">2.5 ₹</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Quick Actions</CardTitle>
                  <CardDescription className="text-indigo-200">Manage your crypto activities</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {[
                    { label: "Promote Your Ad", action: handlePromoteChannel },
                    // { label: "Tasks", tab: "tasks" },
                    { label: "Refer & Earn", tab: "refer" },
                    // { label: "Withdraw", tab: "withdraw" },
                    { label: "Earn $", tab: "earn" },
                  ].map((item, index) => (
                    <Button
                      key={index}
                      variant="secondary"
                      className="w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-none"
                      onClick={() => {
                        if (item.tab) {
                          setActiveTab(item.tab);
                        } else if (item.action) {
                          item.action();
                        }
                      }}
                    >
                      {item.label}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Available Tasks</CardTitle>
                <CardDescription className="text-indigo-200">Complete tasks to earn rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{task.name}</h3>
                      <p className="text-sm text-indigo-200">{task.description}</p>
                    </div>
                    <Button
                      onClick={() => handleClaimTask(task)}
                      disabled={task.completed}
                      variant={task.completed ? "secondary" : "default"}
                      className={task.completed ? "bg-green-500" : ""}
                    >
                      {task.completed ? <Check className="h-4 w-4" /> : "Claim"}
                    </Button>
                  </div>
                ))}
              </CardContent>

            </Card>
          </TabsContent>

          <TabsContent value="refer">
            <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Refer & Earn</CardTitle>
                <CardDescription className="text-indigo-200">Invite friends and earn crypto rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                  <p className="text-sm mb-2">Your Referral Link:</p>
                  <p className="font-mono text-xs break-all">{referralLink}</p>
                </div>
                <Button
                  variant="secondary"
                  className="w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-none"
                  onClick={() => navigator.clipboard.writeText(referralLink)}
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy Link
                </Button>
                <div className="text-center">
                  <p className="text-sm text-indigo-200">Total Referrals</p>
                  <p className="text-3xl font-bold">{referralCount}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Withdraw Funds</CardTitle>
                <CardDescription className="text-indigo-200">Choose your preferred withdrawal method</CardDescription>
              </CardHeader>
              <CardContent>
                {!withdrawalMethod ? (
                  <RadioGroup onValueChange={(value) => setWithdrawalMethod(value as "UPI" | "CRYPTO")} className="space-y-4">
                    <div className="flex items-center space-x-2 bg-white bg-opacity-10 p-4 rounded-lg">
                      <RadioGroupItem value="UPI" id="upi" />
                      <Label htmlFor="upi" className="font-medium">UPI</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-white bg-opacity-10 p-4 rounded-lg">
                      <RadioGroupItem value="CRYPTO" id="crypto" />
                      <Label htmlFor="crypto" className="font-medium">CRYPTO</Label>
                    </div>
                  </RadioGroup>
                ) : withdrawalMethod === "UPI" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Enter your Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name here"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="bg-white bg-opacity-10 border-none text-white placeholder-indigo-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="upiId">Enter your UPI Id</Label>
                      <Input
                        id="upiId"
                        placeholder="Enter your UPI Id here"
                        value={formData.upiId}
                        onChange={handleInputChange}
                        className="bg-white bg-opacity-10 border-none text-white placeholder-indigo-300"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="coinName">Enter your coin name</Label>
                      <Input
                        id="coinName"
                        placeholder="Coin name here"
                        value={formData.coinName}
                        onChange={handleInputChange}
                        className="bg-white bg-opacity-10 border-none text-white placeholder-indigo-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cryptoAddress">Enter your crypto address</Label>
                      <Input
                        id="cryptoAddress"
                        placeholder="Crypto address here"
                        value={formData.cryptoAddress}
                        onChange={handleInputChange}
                        className="bg-white bg-opacity-10 border-none text-white placeholder-indigo-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cryptoNetwork">Enter your network of crypto</Label>
                      <Input
                        id="cryptoNetwork"
                        placeholder="Crypto network name here"
                        value={formData.cryptoNetwork}
                        onChange={handleInputChange}
                        className="bg-white bg-opacity-10 border-none text-white placeholder-indigo-300"
                      />
                    </div>
                  </div>
                )}

                {withdrawalMethod && (
                  <div className="mt-6 space-y-4">
                    <Button onClick={handleConfirm} className="w-full bg-green-500 hover:bg-green-600">
                      <Check className="mr-2 h-4 w-4" /> Confirm
                    </Button>
                    <Button onClick={() => setWithdrawalMethod(null)} variant="outline" className="w-full bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-none">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  </div>
                )}

                <p className="text-xs text-indigo-200 mt-6">
                  Disclaimer: TrueMoj automatically processes withdrawals at the end of each month and on the 18th.
                  Don't worry—your earned money is always safe.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earn">
            <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Earn Opportunities</CardTitle>
                <CardDescription className="text-indigo-200">Grow your crypto portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {earnOpp.map((opportunity, index) => (
                  <div key={index} className="p-4 bg-white bg-opacity-10 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{opportunity.name}</h3>
                    <p className="text-sm text-indigo-200 mb-4">{opportunity.description}</p>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleDepostitEarnOpp(opportunity)} variant="secondary" className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-none">
                        Deposit
                      </Button>
                      <Button onClick={() => handleWithdrawEarnOpp(opportunity)} variant="secondary" className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-none">
                        Withdraw
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </main>

        <TabsList className="fixed bottom-0 left-0 right-0 h-16 grid grid-cols-5 bg-black bg-opacity-50 backdrop-blur-lg border-t border-indigo-800">
          {[
            { value: "home", icon: Home, label: "Home" },
            { value: "tasks", icon: Check, label: "Tasks" },
            { value: "refer", icon: Users, label: "Refer" },
            { value: "withdraw", icon: CreditCard, label: "Withdraw" },
            { value: "earn", icon: DollarSign, label: "Earn" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex flex-col items-center justify-center text-indigo-200 data-[state=active]:text-white"
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
