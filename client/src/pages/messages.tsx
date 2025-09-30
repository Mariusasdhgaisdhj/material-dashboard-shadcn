import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";

export default function Messages() {
  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <Card className="border-stone-200">
        <CardHeader className="border-b border-stone-200">
          <CardTitle className="text-lg font-semibold text-stone-900">Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-stone-500 mb-4">
              <p className="text-lg mb-2">💬 Messages & Conversations</p>
              <p className="text-sm">
                The messages/conversations feature requires user authentication and specific user IDs to access conversations.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> To view conversations, users need to be logged in and the system will fetch conversations based on their user ID. 
                This is a security feature to ensure users only see their own conversations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


