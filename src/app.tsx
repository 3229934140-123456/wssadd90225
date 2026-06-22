import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useTaskStore } from '@/store/useTaskStore';
import './app.scss';

function App(props) {
  const hydrate = useTaskStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  useDidShow(() => {
    hydrate();
  });

  useDidHide(() => {});

  return props.children;
}

export default App;
