'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronRight, Copy, CreditCard, DollarSign, Home, Users } from 'lucide-react'
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
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const base = `https://api-tma.vectoroad.com/`
declare global {
  interface Window {
    Telegram: any;
  }
}
// interface WithdrawalDetail {
//   method: string;
//   details: {
//     name?: string;
//     upiId?: string;
//     coinName?: string;
//     cryptoAddress?: string;
//     cryptoNetwork?: string;
//   };
// }

// Define the Task type
interface Task {
  _id?: any;
  id: number;
  name: string;
  points: number;
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
  { id: 1, name: 'Join Telegram Channel', description: 'Join our official channel', points: 2.5, channelId: "1234", completed: false },
  { id: 2, name: 'Invite Friends', description: 'Invite 5 friends to the app', points: 2.5, channelId: "1234", completed: false },
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
  const [referBalance, setReferBalance] = useState(0);
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
    if (!withdrawalMethod) {
      toast.error("Please select a withdrawal method.");
      return;
    }

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

    if (!Object.values(details).every((value) => value.trim() !== "")) {
      toast.error("Please fill in all the required fields.");
      return;
    }

    const response = await saveWithdrawalDetails(user?.id, withdrawalMethod, details);

    if (response.success) {
      toast.success("Withdrawal details saved successfully!");
      await fetchUserDetails(); // Update user data
      setWithdrawalMethod(null); // Reset the withdrawal method
      setFormData({
        name: "",
        upiId: "",
        coinName: "",
        cryptoAddress: "",
        cryptoNetwork: "",
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
      setBalance(userResponse?.balance || 0);
      setReferBalance(userResponse?.referBalance || 0)

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

  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(`${base}api/users/details/${user?.id}`);
      console.log("UserData: ", response)
      setUserData(response.data);
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
      window.open(metaData?.adChannelLink, '_blank');
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
      if (response?.data?.redirectUrl) {
        const channelLink = response?.data?.redirectUrl;
        window.open(channelLink, '_blank');
      }
      if (response?.data?.message) {
        toast.success(response?.data?.message);
      }
      // Check for success status and fetch tasks again
      if (response.status == 201) {
        await fetchUserDetails();
      }
      // await fetchUserDetails(); // Call fetchTasks to refresh the task list

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
      window.open(channelLink, '_blank')
    }
    catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }

  const handleWithdrawEarnOpp = async (earnOpp: any) => {
    const telegram = window.Telegram?.WebApp;
    try {
      const channelLink = `https://${earnOpp?.withdrawLink}`
      window.open(channelLink, '_blank')
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-6">
        <Card className="w-full max-w-md p-8 bg-gradient-to-br from-indigo-800 to-purple-800 text-white rounded-2xl shadow-2xl">
          {/* Header Section */}
          <CardHeader className="text-center mb-6">
            <CardTitle className="text-3xl font-extrabold tracking-wide mb-2">
              Welcome to <span className="text-indigo-100">TrueMoj Community</span>
            </CardTitle>
            <p className="text-sm text-indigo-300">
              Join our official Telegram channel to unlock exclusive rewards and perks!
            </p>
          </CardHeader>

          {/* Button Section */}
          <CardContent className="flex flex-col items-center space-y-4">
            <Button
              onClick={handleJoinChannel}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
            >
              🚀 Join the Channel
            </Button>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-indigo-300 hover:text-indigo-400 underline transition-colors duration-200"
            >
              🔄 Refresh Page
            </button>
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
                <h1 className="text-xl font-bold">TrueMoj 🐶</h1>
                <p className="text-sm text-indigo-200">Real Rewards, No Bull</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{userData?.balance || balance} ₹</p>
              <p className="text-xs text-indigo-200">Current Balance</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <TabsContent value="home">
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl overflow-hidden relative">
                <div className="relative h-60 overflow-hidden">
                  {/* Full-Sized Image with Subtle Effect */}
                  <img
                    src={bannerImage}
                    alt="Promotional Banner"
                    className="w-full h-full object-cover filter brightness-75 transition-transform duration-500 hover:scale-105"
                  />
                </div>
                {/* <div className="absolute inset-0 flex items-center justify-center">
                    <h2 className="text-3xl font-bold text-white drop-shadow-lg animate-bounce">
                      Crypto Rewards Await!
                    </h2>
                  </div> */}
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2 bg-indigo-700 bg-opacity-70 rounded-md shadow-inner">
                      <p className="text-sm text-indigo-200">Per Referral</p>
                      <p className="text-lg font-bold">5 ₹</p>
                    </div>
                    <div className="p-2 bg-purple-700 bg-opacity-70 rounded-md shadow-inner">
                      <p className="text-sm text-purple-200">Per Task</p>
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
                <CardTitle className="text-2xl font-bold">TrueMoj 🐶, Available Tasks</CardTitle>
                <CardDescription className="text-indigo-200">Complete tasks to earn rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-900 to-purple-800 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Task Details */}
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold">{task.name}</h3>
                      {/* Optional Description */}
                      {task.description && (
                        <p className="text-xs text-indigo-300 mt-1">{task.description}</p>
                      )}
                    </div>

                    {/* Action Button with Reward */}
                    <Button
                      onClick={() => handleClaimTask(task)}
                      disabled={userData.completedTasks.includes(task._id)}
                      className={`px-6 py-2 font-medium text-sm rounded-md transition-all duration-300 ${userData.completedTasks.includes(task._id)
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                    >
                      {userData.completedTasks.includes(task._id) ? (
                        <div className="flex items-center">
                          <Check className="h-4 w-4 mr-1" /> Claimed
                        </div>
                      ) : (
                        `Claim ₹${task.points}`
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>




            </Card>
          </TabsContent>

          <TabsContent value="refer">
            <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">TrueMoj 🐶, Refer & Earn</CardTitle>
                <CardDescription className="text-indigo-200">
                  Share your referral link and earn 5₹ for each new user!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                  <p className="text-sm mb-2">Your Invite Link:</p>
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
                  <p className="text-sm text-indigo-200">Total Refers:</p>
                  <p className="text-3xl font-bold">{referralCount} users</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-indigo-200">Your Total Balance:</p>
                  <p className="text-3xl font-bold">{userData?.referBalance || referBalance}₹</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw">
            <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">TrueMoj 🐶, Withdrawals</CardTitle>
                <CardDescription className="text-indigo-200">
                  Manage your withdrawal methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!withdrawalMethod ? (
                  <div className="space-y-6">
                    {/* Step 1: Show existing details and options */}
                    {userData.withdrawalDetails.map((detail: any, index: any) => (
                      <div key={index} className="p-4 bg-white bg-opacity-10 rounded-lg space-y-2">
                        <h3 className="text-lg font-bold text-indigo-300">{detail.method} Withdrawal</h3>
                        <div className="text-sm text-indigo-200">
                          {detail.method === "UPI" ? (
                            <>
                              <p><strong>Name:</strong> {detail.details.name}</p>
                              <p><strong>UPI ID:</strong> {detail.details.upiId}</p>
                            </>
                          ) : (
                            <>
                              <p><strong>Coin Name:</strong> {detail.details.coinName}</p>
                              <p><strong>Crypto Address:</strong> {detail.details.cryptoAddress}</p>
                              <p><strong>Network:</strong> {detail.details.cryptoNetwork}</p>
                            </>
                          )}
                        </div>
                        {/* Edit Button */}
                        <Button
                          onClick={() => {
                            setWithdrawalMethod(detail.method);
                            setFormData(detail.details);
                          }}
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 rounded-lg"
                        >
                          Edit {detail.method} Details
                        </Button>
                      </div>
                    ))}

                    {/* Add new method if not already added */}
                    {userData.withdrawalDetails.length < 2 && (
                      <div className="grid grid-cols-2 gap-4">
                        {!userData.withdrawalDetails.some((detail: any) => detail.method === "UPI") && (
                          <Button
                            onClick={() => setWithdrawalMethod("UPI")}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
                          >
                            Add UPI
                          </Button>
                        )}
                        {!userData.withdrawalDetails.some((detail: any) => detail.method === "CRYPTO") && (
                          <Button
                            onClick={() => setWithdrawalMethod("CRYPTO")}
                            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg"
                          >
                            Add CRYPTO
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Step 2: Add or Edit Selected Method */}
                    {withdrawalMethod === "UPI" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-indigo-300">UPI Withdrawal</h3>
                        <Label htmlFor="name">Enter your Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                        <Label htmlFor="upiId">Enter your UPI ID</Label>
                        <Input
                          id="upiId"
                          placeholder="Enter your UPI ID"
                          value={formData.upiId}
                          onChange={handleInputChange}
                        />
                        <Button
                          onClick={handleConfirm}
                          className="w-full bg-green-500 hover:bg-green-600"
                        >
                          Save UPI Details
                        </Button>
                      </div>
                    )}
                    {withdrawalMethod === "CRYPTO" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-indigo-300">Crypto Withdrawal</h3>
                        <Label htmlFor="coinName">Enter your Coin Name</Label>
                        <Input
                          id="coinName"
                          placeholder="Enter your coin name"
                          value={formData.coinName}
                          onChange={handleInputChange}
                        />
                        <Label htmlFor="cryptoAddress">Enter your Crypto Address</Label>
                        <Input
                          id="cryptoAddress"
                          placeholder="Enter your crypto address"
                          value={formData.cryptoAddress}
                          onChange={handleInputChange}
                        />
                        <Label htmlFor="cryptoNetwork">Enter your Network</Label>
                        <Input
                          id="cryptoNetwork"
                          placeholder="Enter your network"
                          value={formData.cryptoNetwork}
                          onChange={handleInputChange}
                        />
                        <Button
                          onClick={handleConfirm}
                          className="w-full bg-green-500 hover:bg-green-600"
                        >
                          Save Crypto Details
                        </Button>
                      </div>
                    )}
                    {/* Back Button */}
                    <Button
                      onClick={() => {
                        setWithdrawalMethod(null);
                        setFormData({
                          name: "",
                          upiId: "",
                          coinName: "",
                          cryptoAddress: "",
                          cryptoNetwork: "",
                        });
                      }}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-lg"
                    >
                      Back
                    </Button>
                  </div>
                )}
                <p className="text-xs text-indigo-200 mt-6">
                  Disclaimer: TrueMoj automatically processes withdrawals at the end of each month and on the 18th. Your money is always safe.
                </p>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="earn">
            <Card className="bg-gradient-to-br from-indigo-800 to-purple-800 border-none text-white shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">TrueMoj 🐶, Earn Opportunities</CardTitle>
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
